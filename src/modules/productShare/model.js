const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { Product } = require("../product/model");

const ProductShare = sequelize.define(
  "ProductShare",
  {
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      field: "user_id",
      references: { model: User, key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      field: "product_id",
      references: { model: Product, key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    sharedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "shared_at",
    },
  },
  {
    tableName: "product_shares",
    underscored: true,
    timestamps: false,
  }
);

User.hasMany(ProductShare, {
  foreignKey: "userId",
  as: "productShares",
  onDelete: "CASCADE",
});

Product.hasMany(ProductShare, {
  foreignKey: "productId",
  as: "shares",
  onDelete: "CASCADE",
});

ProductShare.belongsTo(User, { foreignKey: "userId", as: "user" });
ProductShare.belongsTo(Product, { foreignKey: "productId", as: "product" });

module.exports = { ProductShare };
