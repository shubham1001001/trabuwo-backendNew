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
    },
    name: { type: DataTypes.STRING, allowNull: false },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "home_categories",
        key: "id",
      },
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: CategorySection,
        key: "id",
      },
    },
    redirectCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Category,
        key: "id",
      },
    },
    imgUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deviceType: {
      type: DataTypes.ENUM("mobile", "web", "both"),
      allowNull: false,
      defaultValue: "both",
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
