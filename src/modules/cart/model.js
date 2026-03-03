const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { ProductVariant } = require("../product/model");
const { v7: uuidv7 } = require("uuid");

const Cart = sequelize.define(
  "Cart",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: () => uuidv7(),
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "userId",
      references: {
        model: User,
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("active", "abandoned", "converted"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    timestamps: true,
    tableName: "carts",
    underscored: true,
  }
);

const CartItem = sequelize.define(
  "CartItem",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: () => uuidv7(),
    },
    cartId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "cartId",
      references: {
        model: Cart,
        key: "id",
      },
    },
    productVariantId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "productVariantId",
      references: {
        model: ProductVariant,
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
  },
  {
    timestamps: true,
    tableName: "cart_items",
    underscored: true,
  }
);

Cart.belongsTo(User, { foreignKey: "userId", as: "user" });
Cart.hasMany(CartItem, {
  foreignKey: "cartId",
  as: "items",
  onDelete: "CASCADE",
});
CartItem.belongsTo(Cart, {
  foreignKey: "cartId",
  as: "cart",
});
CartItem.belongsTo(ProductVariant, {
  foreignKey: "productVariantId",
  as: "productVariant",
});

module.exports = {
  Cart,
  CartItem,
};
