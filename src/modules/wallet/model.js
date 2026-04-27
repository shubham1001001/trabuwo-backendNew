const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { Order } = require("../order/model");
const { v7: uuidv7 } = require("uuid");

const Wallet = sequelize.define(
  "Wallet",
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
    },
    pendingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    availableBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lockedBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "wallets",
    underscored: true,
    timestamps: true,
  }
);

const WalletTransaction = sequelize.define(
  "WalletTransaction",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    walletId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: Wallet, key: "id" },
    },
    orderId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: Order, key: "id" },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("credit", "debit"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "available", "cancelled", "locked"),
      allowNull: false,
      defaultValue: "pending",
    },
    reason: {
      type: DataTypes.ENUM(
        "order_earning",
        "reseller_margin",
        "commission_deduction",
        "shipping_fee",
        "platform_fee",
        "withdrawal",
        "refund",
        "penalty",
        "adjustment"
      ),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "wallet_transactions",
    underscored: true,
    timestamps: true,
  }
);

User.hasOne(Wallet, { foreignKey: "userId", as: "wallet" });
Wallet.belongsTo(User, { foreignKey: "userId", as: "user" });

Wallet.hasMany(WalletTransaction, { foreignKey: "walletId", as: "transactions" });
WalletTransaction.belongsTo(Wallet, { foreignKey: "walletId", as: "wallet" });

WalletTransaction.belongsTo(Order, { foreignKey: "orderId", as: "order" });

module.exports = { Wallet, WalletTransaction };
