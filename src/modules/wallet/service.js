const dao = require("./dao");
const sequelize = require("../../config/database");
const { NotFoundError, ValidationError } = require("../../utils/errors");

exports.getOrCreateWallet = async (userId, transaction) => {
  let wallet = await dao.getWalletByUserId(userId, { transaction });
  if (!wallet) {
    wallet = await dao.createWallet({ userId }, { transaction });
  }
  return wallet;
};

exports.creditOrderEarnings = async (order, transaction) => {
  return await sequelize.transaction({ transaction }, async (t) => {
    // 1. Process Seller Earnings (LP - Commission)
    // For simplicity, we assume order.items has pre-calculated sellerPayout
    for (const item of order.items) {
      const product = item.productVariant.product; // Assuming inclusion
      const sellerId = product.catalogue.userId;
      
      const sellerWallet = await exports.getOrCreateWallet(sellerId, t);
      
      await dao.createTransaction({
        walletId: sellerWallet.id,
        orderId: order.id,
        amount: item.sellerPayout,
        type: "credit",
        status: "pending",
        reason: "order_earning",
        metadata: { itemId: item.id, listingPrice: item.listingPrice }
      }, { transaction: t });

      await dao.updateWalletBalances(sellerWallet.id, {
        pendingBalance: sequelize.literal(`pending_balance + ${item.sellerPayout}`)
      }, { transaction: t });
    }

    // 2. Process Reseller Margin (RM)
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
    }
  });
};

exports.releaseFunds = async (orderId) => {
  return await sequelize.transaction(async (t) => {
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

exports.handleReturn = async (orderId) => {
  return await sequelize.transaction(async (t) => {
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
    }
  });
};
