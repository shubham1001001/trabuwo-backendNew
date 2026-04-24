const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Category = require("../category/model");
const { v7: uuidv7 } = require("uuid");

const MobileCategorySection = sequelize.define(
  "MobileCategorySection",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
      field: "public_id",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
      field: "category_id",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "display_order",
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_visible",
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "image_url",
    },
    tiles: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_deleted",
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "mobile_category_sections",
  }
);

MobileCategorySection.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

Category.hasMany(MobileCategorySection, {
  foreignKey: "categoryId",
  as: "mobileSections",
});

module.exports = MobileCategorySection;
