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
