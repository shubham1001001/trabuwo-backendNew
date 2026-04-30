const dao = require("./dao");
const { ValidationError } = require("../../utils/errors");
const sequelize = require("../../config/database");

const getOrCreateBalance = async (userId, options = {}) => {
  let balance = await dao.findByUserId(userId, options);
  if (!balance) {
    balance = await dao.createBalance(userId, options);
  }
  return balance;
};

exports.getOrCreateBalance = getOrCreateBalance;

exports.creditBalance = async (userId, amount, reason, orderId = null, options = {}) => {
  return sequelize.transaction(async (t) => {
    const txOptions = options.transaction ? options : { transaction: t };

    const balance = await getOrCreateBalance(userId, txOptions);

    await dao.incrementBalance(balance.id, amount, txOptions);

    const updatedBalance = await dao.findByUserId(userId, txOptions);
    const balanceAfter = Number(updatedBalance.balance);

    await dao.createTransaction(
      {
        userId,
        orderId,
        amount: Number(amount),
        type: "credit",
        reason,
        balanceAfter,
      },
      txOptions
    );

    return { balance: balanceAfter };
  });
};

exports.debitBalance = async (userId, amount, reason, orderId = null, options = {}) => {
  return sequelize.transaction(async (t) => {
    const txOptions = options.transaction ? options : { transaction: t };

    const balance = await getOrCreateBalance(userId, txOptions);

    if (Number(balance.balance) < Number(amount)) {
      throw new ValidationError("Insufficient Trabuwo balance");
    }

    await dao.decrementBalance(balance.id, amount, txOptions);

    const updatedBalance = await dao.findByUserId(userId, txOptions);
    const balanceAfter = Number(updatedBalance.balance);

    await dao.createTransaction(
      {
        userId,
        orderId,
        amount: Number(amount),
        type: "debit",
        reason,
        balanceAfter,
      },
      txOptions
    );

    return { balance: balanceAfter };
  });
};

exports.getBalanceSummary = async (userId, { page = 1, limit = 20 } = {}) => {
  const balance = await getOrCreateBalance(userId);
  const offset = (page - 1) * limit;

  const { count, rows } = await dao.getTransactionsByUserId(userId, {
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  return {
    balance: Number(balance.balance),
    transactions: rows.map((tx) => ({
      publicId: tx.publicId,
      amount: Number(tx.amount),
      type: tx.type,
      reason: tx.reason,
      balanceAfter: Number(tx.balanceAfter),
      orderId: tx.orderId,
      createdAt: tx.createdAt,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};
