const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { Product } = require("../product/model");

const ProductMetricsDaily = sequelize.define(
  "ProductMetricsDaily",
  {
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    views: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    clicks: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    orders: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    salesAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    returns: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    avgRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ratingCount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "product_metrics_daily",
    timestamps: true,
    underscored: true,
  }
);

ProductMetricsDaily.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

Product.hasMany(ProductMetricsDaily, {
  foreignKey: "productId",
  as: "dailyMetrics",
});

module.exports = {
  ProductMetricsDaily,
};
