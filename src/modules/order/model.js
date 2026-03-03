const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { ProductVariant } = require("../product/model");
const { UserAddress } = require("../userAddress/model");
const { Sequelize } = require("sequelize");
const { v7: uuidv7 } = require("uuid");

const Order = sequelize.define(
  "Order",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    buyerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM(
        "on_hold",
        "pending",
        "ready_to_ship",
        "shipped",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "on_hold",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dispatchDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("NOW() + INTERVAL '2 days'"),
    },
    slaDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("NOW() + INTERVAL '3 days'"),
    },
    slaStatus: {
      type: DataTypes.ENUM("breached", "breaching_soon", "other"),
      allowNull: false,
      defaultValue: "other",
    },
    buyerAddressId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: UserAddress,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "orders",
  }
);

const OrderItem = sequelize.define(
  "OrderItem",
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
      references: {
        model: Order,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    productVariantId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: ProductVariant,
        key: "id",
      },
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "order_items",
  }
);

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

OrderItem.belongsTo(ProductVariant, {
  foreignKey: "productVariantId",
  as: "productVariant",
});
ProductVariant.hasMany(OrderItem, {
  foreignKey: "productVariantId",
  as: "orderItems",
});

Order.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
Order.belongsTo(UserAddress, {
  foreignKey: "buyerAddressId",
  as: "buyerAddress",
});

module.exports = { Order, OrderItem };
