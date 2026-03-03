const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { Product } = require("../product/model");
const { v7: uuidv7 } = require("uuid");

const ProductPriceHistory = sequelize.define(
  "ProductPriceHistory",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "User who made the price change",
    },
    oldPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Previous price value",
    },
    newPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "New price value",
    },
    oldDefectiveReturnPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Previous defective return price value",
    },
    newDefectiveReturnPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "New defective return price value",
    },
  },
  {
    timestamps: true,
    tableName: "product_price_history",
    underscored: true,
  }
);

ProductPriceHistory.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
  onDelete: "CASCADE",
});
Product.hasMany(ProductPriceHistory, {
  foreignKey: "productId",
  as: "priceHistory",
});

const ProductView = sequelize.define(
  "ProductView",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    viewDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Date of the view count",
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Number of views for this product on this date",
    },
  },
  {
    timestamps: true,
    tableName: "product_views",
    underscored: true,
  }
);

ProductView.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Product.hasMany(ProductView, {
  foreignKey: "productId",
  as: "views",
});

module.exports = { ProductPriceHistory, ProductView };
