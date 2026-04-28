const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { v7: uuidv7 } = require("uuid");

const PlatformConfig = sequelize.define(
  "PlatformConfig",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Unique config key, e.g. 'commission_rate', 'shipping_fee'",
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Stored value (cast based on valueType)",
    },
    valueType: {
      type: DataTypes.ENUM("number", "percentage", "boolean", "json"),
      allowNull: false,
      defaultValue: "number",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "general",
      comment: "Config category: pricing, commission, logistics, payout, reseller",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "platform_configs",
    indexes: [
      {
        fields: ["key"],
        unique: true,
      },
      {
        fields: ["category"],
      },
    ],
  }
);

const CategoryCommission = sequelize.define(
  "CategoryCommission",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    categoryId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "FK to categories table",
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: "Commission rate as percentage (e.g. 5.00 = 5%)",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "category_commissions",
    indexes: [
      {
        fields: ["category_id"],
        unique: true,
      },
    ],
  }
);

module.exports = { PlatformConfig, CategoryCommission };
