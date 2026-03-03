const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { Product } = require("../product/model");

const ProductViewHistory = sequelize.define(
  "ProductViewHistory",
  {
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      field: "product_id",
      references: {
        model: Product,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "viewed_at",
    },
  },
  {
    tableName: "product_view_history",
    underscored: true,
    timestamps: false,
  }
);

User.hasMany(ProductViewHistory, {
  foreignKey: "userId",
  as: "productViewHistory",
  onDelete: "CASCADE",
});

Product.hasMany(ProductViewHistory, {
  foreignKey: "productId",
  as: "viewHistory",
  onDelete: "CASCADE",
});

ProductViewHistory.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

ProductViewHistory.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

module.exports = { ProductViewHistory };
