const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const OrderCancelReason = sequelize.define(
  "OrderCancelReason",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subreasons: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    type: {
      type: DataTypes.STRING(50),
      defaultValue: "cancel", // 'cancel' or 'return'
    },
    userType: {
      type: DataTypes.ENUM("buyer", "seller"),
      allowNull: false,
      defaultValue: "buyer",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "order_cancel_reasons",
  }
);

module.exports = { OrderCancelReason };
