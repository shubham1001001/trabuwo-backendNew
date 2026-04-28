const { Wallet, WalletTransaction } = require("./model");
const { Op } = require("sequelize");

exports.getWalletByUserId = async (userId, options = {}) => {
  return await Wallet.findOne({
    where: { userId },
    ...options,
  });
};

exports.createWallet = async (data, options = {}) => {
  return await Wallet.create(data, options);
};

exports.updateWalletBalances = async (walletId, updates, options = {}) => {
  return await Wallet.update(updates, {
    where: { id: walletId },
    ...options,
  });
};

exports.createTransaction = async (data, options = {}) => {
  return await WalletTransaction.create(data, options);
};

exports.getTransactionsByWalletId = async (walletId, options = {}) => {
  return await WalletTransaction.findAll({
    where: { walletId },
    order: [["createdAt", "DESC"]],
    ...options,
  });
};

exports.getTransactionByOrderIdAndReason = async (orderId, reason, options = {}) => {
  return await WalletTransaction.findOne({
    where: { orderId, reason },
    ...options,
  });
};

exports.updateTransactionStatus = async (transactionId, status, options = {}) => {
  return await WalletTransaction.update(
    { status },
    { where: { id: transactionId }, ...options }
  );
};

// ──────── Platform Ledger ────────

const { PlatformLedger, PayoutRequest } = require("./model");

exports.createLedgerEntry = async (data, options = {}) => {
  return await PlatformLedger.create(data, options);
};

exports.getLedgerEntriesByOrderId = async (orderId, options = {}) => {
  return await PlatformLedger.findAll({
    where: { orderId },
    ...options,
  });
};

exports.getLedgerEntries = async (filters = {}, options = {}) => {
  return await PlatformLedger.findAll({
    where: filters,
    order: [["createdAt", "DESC"]],
    ...options,
  });
};

// ──────── Payout Requests ────────

exports.createPayoutRequest = async (data, options = {}) => {
  return await PayoutRequest.create(data, options);
};

exports.getPayoutRequestById = async (id, options = {}) => {
  return await PayoutRequest.findByPk(id, options);
};

exports.getPayoutRequests = async (filters = {}, options = {}) => {
  return await PayoutRequest.findAll({
    where: filters,
    order: [["createdAt", "DESC"]],
    ...options,
  });
};

exports.updatePayoutRequest = async (id, data, options = {}) => {
  return await PayoutRequest.update(data, {
    where: { id },
    ...options,
  });
};

exports.getPendingPayoutRequestsByUserId = async (userId, options = {}) => {
  return await PayoutRequest.findAll({
    where: { userId, status: ["pending", "approved", "processing"] },
    ...options,
  });
};

exports.getAllWalletsWithUsers = async () => {
  const { User } = require("../auth/model");
  return await Wallet.findAll({
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "mobile"],
      },
    ],
    order: [["availableBalance", "DESC"]],
  });
};
