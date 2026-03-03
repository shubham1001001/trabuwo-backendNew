const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Category = require("../category/model");
const { v7: uuidv7 } = require("uuid");

const CategoryIcon = sequelize.define(
  "CategoryIcon",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv7(),
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Category, key: "id" },
    },
    filter: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    iconUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    originalImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    altText: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "category_icons",
    indexes: [
      { fields: ["category_id"], name: "idx_category_icons_category_id" },
      { fields: ["public_id"], name: "idx_category_icons_public_id" },
      {
        fields: ["category_id", "enabled", "is_deleted"],
        name: "idx_category_icons_category_enabled_not_deleted",
      },
    ],
  }
);

CategoryIcon.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

Category.hasMany(CategoryIcon, {
  foreignKey: "categoryId",
  as: "icons",
});

module.exports = CategoryIcon;
