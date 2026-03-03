const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { Product } = require("../product/model");

const Promotion = sequelize.define(
  "Promotion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "SALE_EVENTS",
        "DAILY_DEALS",
        "FLASH_EVENTS",
        "WISHCART_AND_CART_OFFERS"
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "ACTIVE", "PAUSED", "EXPIRED"),
      defaultValue: "DRAFT",
    },
    discountType: {
      type: DataTypes.ENUM("PERCENTAGE", "FIXED_AMOUNT"),
      allowNull: false,
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    minOrderValue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    maxDiscount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "promotions",
    timestamps: true,
    underscored: true,
  }
);

const PromotionSeller = sequelize.define(
  "PromotionSeller",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Promotion,
        key: "id",
      },
    },
    sellerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    registrationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      defaultValue: "PENDING",
    },
    approvalDate: {
      type: DataTypes.DATE,
    },
    approvedBy: {
      type: DataTypes.BIGINT,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    tableName: "promotion_sellers",
    timestamps: true,
    underscored: true,
  }
);

const PromotionProduct = sequelize.define(
  "PromotionProduct",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Promotion,
        key: "id",
      },
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: {
        model: Product,
        key: "id",
      },
    },
    sellerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    discountPercent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    returnDefectiveDiscountPercent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "promotion_products",
    timestamps: true,
    underscored: true,
  }
);

Promotion.hasMany(PromotionSeller, { foreignKey: "promotionId" });
PromotionSeller.belongsTo(Promotion, { foreignKey: "promotionId" });

Promotion.hasMany(PromotionProduct, { foreignKey: "promotionId" });
PromotionProduct.belongsTo(Promotion, {
  foreignKey: "promotionId",
  as: "promotion",
});

Product.hasMany(PromotionProduct, {
  foreignKey: "productId",
  as: "promotions",
});
PromotionProduct.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

module.exports = {
  Promotion,
  PromotionSeller,
  PromotionProduct,
};
