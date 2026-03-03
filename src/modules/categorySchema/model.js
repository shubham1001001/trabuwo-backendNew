const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Category = require("../category/model");

const CategorySchema = sequelize.define(
  "CategorySchema",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
    },
    fieldName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fieldType: {
      type: DataTypes.ENUM("text", "number", "select", "boolean"),
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },
    required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    validation: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    section: {
      type: DataTypes.ENUM("basicDetails", "additionalDetails", "addVariant"),
      allowNull: false,
    },
    isFilterable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "category_schemas",
  }
);

CategorySchema.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});
Category.hasMany(CategorySchema, { foreignKey: "categoryId", as: "schema" });

module.exports = CategorySchema;
