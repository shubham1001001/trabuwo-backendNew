const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const OriginalBrandCategory = sequelize.define(
  "OriginalBrandCategory",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      allowNull: false,
      unique: true,
      field: "public_id",
    },
    name: { type: DataTypes.STRING, allowNull: false },
    redirectCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "redirect_category_id",
      references: {
        model: "categories",
        key: "id",
      },
    },
    imgUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "img_url",
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "display_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_deleted",
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "original_brand_categories",
  }
);

module.exports = OriginalBrandCategory;
