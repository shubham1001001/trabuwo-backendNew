const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { Order } = require("../order/model");
const { v7: uuidv7 } = require("uuid");

const Shipment = sequelize.define(
  "Shipment",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    orderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: {
        model: Order,
        key: "id",
      },
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    },
    sellerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    },
    shiprocketOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    shipmentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    awbNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    courierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    courierName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "intransit",
        "delivered",
        "cancelled",
        "returned"
      ),
      defaultValue: "pending",
    },
    pickupScheduledDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pickupScheduledSlot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estimatedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shippingCharges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    dimensions: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    labelUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trackingUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    currentStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currentStatusId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    shipmentStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipmentStatusId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    etd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    channelOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    channel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "shipments",
  }
);

const ShiprocketWebhookScan = sequelize.define(
  "ShiprocketWebhookScan",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    shipmentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Shipment,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    activity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "shiprocket_webhook_scans",
  }
);

Shipment.belongsTo(Order, { foreignKey: "orderId", as: "order" });
Shipment.belongsTo(User, { foreignKey: "sellerId", as: "seller" });
Shipment.hasMany(ShiprocketWebhookScan, {
  foreignKey: "shipmentId",
  as: "webhookScans",
});

ShiprocketWebhookScan.belongsTo(Shipment, {
  foreignKey: "shipmentId",
  as: "shipment",
});

Order.hasOne(Shipment, { foreignKey: "orderId", as: "shipment" });
User.hasMany(Shipment, { foreignKey: "sellerId", as: "shipments" });

module.exports = { Shipment, ShiprocketWebhookScan };
