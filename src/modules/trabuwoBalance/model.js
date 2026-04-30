const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { Order } = require("../order/model");
const { v7: uuidv7 } = require("uuid");

const TrabuwoBalance = sequelize.define(
  "TrabuwoBalance",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: { model: User, key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "trabuwo_balance",
    underscored: true,
    timestamps: true,
  }
);

const TrabuwoBalanceTransaction = sequelize.define(
  "TrabuwoBalanceTransaction",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: User, key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    orderId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: Order, key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("credit", "debit"),
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM(
        "order_cancelled",
        "return_refund",
        "rto_refund",
        "purchase",
        "cashback",
        "adjustment"
      ),
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
  },
  {
    tableName: "trabuwo_balance_transactions",
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

User.hasOne(TrabuwoBalance, { foreignKey: "userId", as: "trabuwoBalance", onDelete: "CASCADE" });
TrabuwoBalance.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(TrabuwoBalanceTransaction, { foreignKey: "userId", as: "trabuwoTransactions", onDelete: "CASCADE" });
TrabuwoBalanceTransaction.belongsTo(User, { foreignKey: "userId", as: "user" });
TrabuwoBalanceTransaction.belongsTo(Order, { foreignKey: "orderId", as: "order" });

module.exports = { TrabuwoBalance, TrabuwoBalanceTransaction };
