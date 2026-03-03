const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { Product } = require("../product/model");
const { v7: uuidv7 } = require("uuid");

const WishlistItem = sequelize.define(
  "WishlistItem",
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
      references: {
        model: User,
        key: "id",
      },
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    tableName: "wishlist_items",
    underscored: true,
  }
);

WishlistItem.belongsTo(User, { foreignKey: "userId", as: "user" });
WishlistItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Define hasMany association - Product model is already loaded at this point
Product.hasMany(WishlistItem, { foreignKey: "productId", as: "wishlistItems" });

module.exports = WishlistItem;
