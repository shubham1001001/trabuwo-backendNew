const dao = require("./dao");
const sequelize = require("../../config/database");
const { NotFoundError, ValidationError } = require("../../utils/errors");
const configService = require("../platformConfig/service");

// ──────── Internal Helpers ────────

const recordLedger = async (orderId, entryType, amount, description, metadata = {}, transaction) => {
  await dao.createLedgerEntry({
    orderId,
    entryType,
    amount,
    description,
    metadata
  }, { transaction });
};

// ──────── Public Service Methods ────────

exports.getOrCreateWallet = async (userId, transaction) => {
  let wallet = await dao.getWalletByUserId(userId, { transaction });
  if (!wallet) {
    wallet = await dao.createWallet({ userId }, { transaction });
  }
  return wallet;
};

/**
 * Credits earnings to seller and reseller wallets in 'pending' status.
 * Also records platform-level revenue/costs in the ledger.
 */
exports.creditOrderEarnings = async (order, transaction) => {
  return await sequelize.transaction({ transaction }, async (t) => {
    // 1. Record Buyer Payment in Platform Ledger
    await recordLedger(
      order.id,
      "buyer_payment",
      order.totalAmount,
      `Payment received for order ${order.publicId}`,
      { paymentMethod: order.paymentMethod },
      t
    );

    // 2. Process Seller Earnings (LP - Commission)
    for (const item of order.items) {
      const product = item.productVariant?.product;
      if (!product) continue;

      const sellerId = product.catalogue?.userId;
      if (!sellerId) {
        console.warn(`Seller ID not found for item ${item.id} in order ${order.id}`);
        continue;
      }

      const sellerWallet = await exports.getOrCreateWallet(sellerId, t);

      // Credit Seller Wallet (Pending)
      await dao.createTransaction({
        walletId: sellerWallet.id,
        orderId: order.id,
        amount: item.sellerPayout,
        type: "credit",
        status: "pending",
        reason: "order_earning",
        metadata: {
          itemId: item.id,
          listingPrice: item.listingPrice,
          commissionAmount: item.commissionAmount
        }
      }, { transaction: t });

      await dao.updateWalletBalances(sellerWallet.id, {
        pendingBalance: sequelize.literal(`pending_balance + ${item.sellerPayout}`)
      }, { transaction: t });

      // Record Platform Revenue (Commission)
      await recordLedger(
        order.id,
        "commission_earned",
        item.commissionAmount,
        `Commission earned from item ${item.id} in order ${order.publicId}`,
        { sellerId, itemId: item.id },
        t
      );
    }

    // 3. Process Reseller Margin
    if (order.resellerId && order.items.some(item => parseFloat(item.resellerMargin) > 0)) {
      const resellerWallet = await exports.getOrCreateWallet(order.resellerId, t);
      const totalMargin = order.items.reduce((sum, item) => sum + parseFloat(item.resellerMargin), 0);

      await dao.createTransaction({
        walletId: resellerWallet.id,
        orderId: order.id,
        amount: totalMargin,
        type: "credit",
        status: "pending",
        reason: "reseller_margin",
        metadata: { totalMargin }
      }, { transaction: t });

      await dao.updateWalletBalances(resellerWallet.id, {
        pendingBalance: sequelize.literal(`pending_balance + ${totalMargin}`)
      }, { transaction: t });

      // Record Reseller Credit in Ledger
      await recordLedger(
        order.id,
        "reseller_credit",
        totalMargin,
        `Margin credited to reseller ${order.resellerId} for order ${order.publicId}`,
        { resellerId: order.resellerId },
        t
      );
    }

    // 4. Record Fees in Ledger
    if (parseFloat(order.platformFee) > 0) {
      await recordLedger(order.id, "platform_fee_earned", order.platformFee, "Platform fee earned", {}, t);
    }

    // Shipping Margin (Shipping Fee charged to buyer - Logistics Cost)
    // Note: Logistics cost is usually known after shipment creation or via config
    const logisticsCost = await configService.getLogisticsCost();
    const shippingMargin = parseFloat(order.shippingFee) - logisticsCost;

    await recordLedger(order.id, "shipping_margin", shippingMargin, "Shipping margin", { shippingFee: order.shippingFee, logisticsCost }, t);
  });
};

/**
 * Moves funds from 'pending' to 'available' after T+7 (or manual trigger).
 */
exports.releaseFunds = async (orderId, transaction) => {
  return await sequelize.transaction({ transaction }, async (t) => {
    const transactions = await dao.getTransactionsByWalletId(null, {
      where: { orderId, status: "pending" },
      transaction: t
    });

    for (const tx of transactions) {
      await dao.updateTransactionStatus(tx.id, "available", { transaction: t });

      await dao.updateWalletBalances(tx.walletId, {
        pendingBalance: sequelize.literal(`pending_balance - ${tx.amount}`),
        availableBalance: sequelize.literal(`available_balance + ${tx.amount}`)
      }, { transaction: t });
    }
  });
};

/**
 * Cancels pending credits in case of returns/cancellations.
 */
exports.handleReturn = async (orderId, transaction) => {
  return await sequelize.transaction({ transaction }, async (t) => {
    const transactions = await dao.getTransactionsByWalletId(null, {
      where: { orderId, status: ["pending", "available"] },
      transaction: t
    });

    for (const tx of transactions) {
      const fieldToDecrement = tx.status === "pending" ? "pendingBalance" : "availableBalance";

      await dao.updateTransactionStatus(tx.id, "cancelled", { transaction: t });

      await dao.updateWalletBalances(tx.walletId, {
        [fieldToDecrement]: sequelize.literal(`${fieldToDecrement === 'pendingBalance' ? 'pending_balance' : 'available_balance'} - ${tx.amount}`)
      }, { transaction: t });

      // Record Refund/Return cost in Ledger if needed
    }
  });
};

/**
 * Creates a payout request for a user.
 */
exports.requestWithdrawal = async (userId, amount) => {
  const wallet = await exports.getOrCreateWallet(userId);
  const { minSellerWithdrawal, minResellerWithdrawal } = await configService.getPayoutConfig();

  // Basic validation (role check would be better but we'll assume caller handles it)
  // We'll check available balance
  if (parseFloat(wallet.availableBalance) < amount) {
    throw new ValidationError("Insufficient available balance");
  }

  const existingPending = await dao.getPendingPayoutRequestsByUserId(userId);
  if (existingPending.length > 0) {
    throw new ValidationError("You already have a pending withdrawal request");
  }

  return await sequelize.transaction(async (t) => {
    // 1. Lock the balance
    await dao.updateWalletBalances(wallet.id, {
      availableBalance: sequelize.literal(`available_balance - ${amount}`),
      lockedBalance: sequelize.literal(`locked_balance + ${amount}`)
    }, { transaction: t });

    // 2. Create Transaction record
    await dao.createTransaction({
      walletId: wallet.id,
      amount,
      type: "debit",
      status: "locked",
      reason: "withdrawal",
      description: "Withdrawal request initiated"
    }, { transaction: t });

    // 3. Create Payout Request
    return await dao.createPayoutRequest({
      walletId: wallet.id,
      userId,
      amount,
      status: "pending"
    }, { transaction: t });
  });
};

/**
 * Admin approves/processes a payout request.
 */
exports.processPayoutRequest = async (requestId, status, adminNotes) => {
  const request = await dao.getPayoutRequestById(requestId);
  if (!request) throw new NotFoundError("Payout request not found");

  if (request.status === "completed" || request.status === "rejected") {
    throw new ValidationError("Request already finalized");
  }

  return await sequelize.transaction(async (t) => {
    if (status === "completed") {
      // Move from locked to gone (already deducted from available)
      await dao.updateWalletBalances(request.walletId, {
        lockedBalance: sequelize.literal(`locked_balance - ${request.amount}`)
      }, { transaction: t });

      // Update transaction status
      const tx = await dao.getTransactionsByWalletId(request.walletId, {
        where: { reason: "withdrawal", amount: request.amount, status: "locked" },
        transaction: t,
        limit: 1
      });
      if (tx[0]) {
        await dao.updateTransactionStatus(tx[0].id, "available", { transaction: t }); // 'available' here means processed/done
      }

      // Record in Platform Ledger
      await recordLedger(null, "payout_disbursed", request.amount, `Payout disbursed to user ${request.userId}`, { requestId }, t);
    }
    else if (status === "rejected") {
      // Return from locked to available
      await dao.updateWalletBalances(request.walletId, {
        lockedBalance: sequelize.literal(`locked_balance - ${request.amount}`),
        availableBalance: sequelize.literal(`available_balance + ${request.amount}`)
      }, { transaction: t });

      // Cancel transaction
      const tx = await dao.getTransactionsByWalletId(request.walletId, {
        where: { reason: "withdrawal", amount: request.amount, status: "locked" },
        transaction: t,
        limit: 1
      });
      if (tx[0]) {
        await dao.updateTransactionStatus(tx[0].id, "cancelled", { transaction: t });
      }
    }

    return await dao.updatePayoutRequest(requestId, { status, adminNotes, processedAt: new Date() }, { transaction: t });
  });
};

exports.getWalletSummary = async (userId) => {
  const wallet = await exports.getOrCreateWallet(userId);
  const transactions = await dao.getTransactionsByWalletId(wallet.id, { limit: 10 });
  const pendingPayouts = await dao.getPendingPayoutRequestsByUserId(userId);

  return {
    balances: {
      pending: wallet.pendingBalance,
      available: wallet.availableBalance,
      locked: wallet.lockedBalance
    },
    recentTransactions: transactions,
    activePayoutRequest: pendingPayouts[0] || null
  };
};

/**
 * Returns all sellers with their current wallet balances.
 */
exports.getSellerBalances = async () => {
  // We'll join Wallets with Users (filtering for sellers)
  const wallets = await dao.getAllWalletsWithUsers();
  return wallets;
};
