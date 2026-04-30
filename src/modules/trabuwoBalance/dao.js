const { TrabuwoBalance, TrabuwoBalanceTransaction } = require("./model");

exports.findByUserId = (userId, options = {}) =>
  TrabuwoBalance.findOne({ where: { userId }, ...options });

exports.createBalance = (userId, options = {}) =>
  TrabuwoBalance.create(
    { userId, balance: 0 },
    options
  );

exports.incrementBalance = (balanceId, amount, options = {}) =>
  TrabuwoBalance.increment("balance", {
    by: Number(amount),
    where: { id: balanceId },
    ...options,
  });

exports.decrementBalance = (balanceId, amount, options = {}) =>
  TrabuwoBalance.decrement("balance", {
    by: Number(amount),
    where: { id: balanceId },
    ...options,
  });

exports.createTransaction = (data, options = {}) =>
  TrabuwoBalanceTransaction.create(data, options);

exports.getTransactionsByUserId = (userId, { limit = 20, offset = 0 } = {}) =>
  TrabuwoBalanceTransaction.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
