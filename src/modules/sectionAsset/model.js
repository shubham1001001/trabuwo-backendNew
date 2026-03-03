const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const CategorySection = require("../categorySection/model");
const Category = require("../category/model");
const { v7: uuidv7 } = require("uuid");

const SectionAsset = sequelize.define(
  "SectionAsset",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: CategorySection, key: "id" },
    },
    redirectCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Category, key: "id" },
    },
    iconLargeUrl: { type: DataTypes.STRING(500), allowNull: true },
    originalImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    altText: { type: DataTypes.STRING(255), allowNull: true },
    deviceType: {
      type: DataTypes.ENUM("mobile", "web", "both"),
      allowNull: false,
      defaultValue: "both",
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    filters: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "section_assets",
    indexes: [
      { fields: ["section_id"], name: "idx_section_assets_section_id" },
      {
        fields: ["redirect_category_id"],
        name: "idx_section_assets_redirect_category_id",
      },
    ],
  }
);

SectionAsset.belongsTo(CategorySection, {
  foreignKey: "sectionId",
  as: "section",
});
CategorySection.hasMany(SectionAsset, {
  foreignKey: "sectionId",
  as: "assets",
});

SectionAsset.belongsTo(Category, {
  foreignKey: "redirectCategoryId",
  as: "redirectCategory",
});

module.exports = SectionAsset;
