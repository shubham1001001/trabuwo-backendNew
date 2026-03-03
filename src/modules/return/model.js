const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { OrderItem } = require("../order/model");
const { v7: uuidv7 } = require("uuid");

const Return = sequelize.define(
  "Return",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    orderItemId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: OrderItem,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM(
        "initiated",
        "in_transit",
        "received",
        "refunded",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "initiated",
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    shiprocketReturnOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    shiprocketShipmentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    returnAwbNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    returnTrackingUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    razorpayRefundId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "returns",
  }
);

Return.belongsTo(OrderItem, { foreignKey: "orderItemId", as: "orderItem" });
OrderItem.hasMany(Return, { foreignKey: "orderItemId", as: "returns" });

module.exports = { Return };
