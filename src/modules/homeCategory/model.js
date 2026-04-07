const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const CategorySection = require("../categorySection/model");
const Category = require("../category/model");
const { v7: uuidv7 } = require("uuid");

const HomeCategory = sequelize.define(
  "HomeCategory",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      unique: true,
      field: "public_id",
    },
    name: { type: DataTypes.STRING, allowNull: false },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "parent_id",
      references: {
        model: "home_categories",
        key: "id",
      },
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "section_id",
      references: {
        model: "category_sections",
        key: "id",
      },
    },
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
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_deleted",
    },
    deviceType: {
      type: DataTypes.ENUM("mobile", "web", "both"),
      allowNull: false,
      defaultValue: "both",
      field: "device_type",
    },
    filters: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    showOnHomePage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "show_on_home_page",
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "home_categories",
    indexes: [
      {
        fields: ["section_id"],
        name: "idx_home_categories_section_id",
      },
      {
        fields: ["redirect_category_id"],
        name: "idx_home_categories_redirect_category_id",
      },
    ],
  }
);

HomeCategory.hasMany(HomeCategory, { as: "children", foreignKey: "parentId" });
HomeCategory.belongsTo(HomeCategory, { as: "parent", foreignKey: "parentId" });

HomeCategory.belongsTo(CategorySection, {
  foreignKey: "sectionId",
  as: "section",
});
CategorySection.hasMany(HomeCategory, {
  foreignKey: "sectionId",
  as: "homeCategories",
});

HomeCategory.belongsTo(Category, {
  foreignKey: "redirectCategoryId",
  as: "redirectCategory",
});

module.exports = HomeCategory;
