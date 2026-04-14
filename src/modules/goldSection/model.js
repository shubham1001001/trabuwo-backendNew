const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const GoldSectionSettings = sequelize.define(
  "GoldSectionSettings",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Gold",
    },
    subtitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "Products you choose, quality we promise.",
    },
    heroImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "hero_image_url",
    },
    backgroundImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "background_image_url",
    },
    shopNowCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "shop_now_category_id",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "gold_section_settings",
  }
);

module.exports = GoldSectionSettings;
