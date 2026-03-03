const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { ProductVariant } = require("../product/model");
const { v7: uuidv7 } = require("uuid");

const ProductStockNotification = sequelize.define(
  "ProductStockNotification",
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
    productVariantId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: ProductVariant,
        key: "id",
      },
    },
    isNotified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    tableName: "product_stock_notifications",
    underscored: true,
  }
);

ProductStockNotification.belongsTo(User, { foreignKey: "userId", as: "user" });
ProductStockNotification.belongsTo(ProductVariant, {
  foreignKey: "productVariantId",
  as: "productVariant",
});

module.exports = ProductStockNotification;
