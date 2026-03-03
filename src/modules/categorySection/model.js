const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Category = require("../category/model");
const { v7: uuidv7 } = require("uuid");

const CategorySection = sequelize.define(
  "CategorySection",
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
    name: { type: DataTypes.STRING(100), allowNull: false },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    layout: {
      type: DataTypes.ENUM("horizontal", "grid"),
      allowNull: false,
      defaultValue: "grid",
    },
    column: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    filter: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "category_sections",
    indexes: [
      {
        fields: ["category_id"],
        name: "idx_category_sections_category_id",
      },
      {
        fields: ["filter"],
        name: "idx_category_sections_filter",
        using: "gin",
      },
    ],
  }
);

CategorySection.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});
Category.hasMany(CategorySection, { foreignKey: "categoryId", as: "sections" });

module.exports = CategorySection;
