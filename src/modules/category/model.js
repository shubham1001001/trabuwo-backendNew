const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { v7: uuidv7 } = require("uuid");

const Category = sequelize.define(
  "Category",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      unique: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 255],
      },
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "categories",
        key: "id",
      },
    },
    breadCrumb: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 255],
      },
    },
    isVisible: { type: DataTypes.BOOLEAN, defaultValue: true },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    displayOrderWeb: { type: DataTypes.INTEGER, defaultValue: 1 },
    showOnWeb: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "categories",
  }
);

Category.hasMany(Category, { as: "children", foreignKey: "parentId" });
Category.belongsTo(Category, { as: "parent", foreignKey: "parentId" });

module.exports = Category;
