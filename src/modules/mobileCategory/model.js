const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { v7: uuidv7 } = require("uuid");
const Category = require("../category/model");

const MobileCategory = sequelize.define(
  "MobileCategory",
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
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "parent_id",
      references: {
        model: "mobile_categories",
        key: "id",
      },
    },
    redirection_id: {
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
      field: "bread_crumb",
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "image_url",
    },
    isVisible: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: true,
      field: "is_visible"
    },
    isDeleted: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
      field: "is_deleted"
    },
    displayOrder: { 
      type: DataTypes.INTEGER, 
      defaultValue: 1,
      field: "display_order"
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "mobile_categories",
  }
);

MobileCategory.hasMany(MobileCategory, { as: "children", foreignKey: "parentId" });
MobileCategory.belongsTo(MobileCategory, { as: "parent", foreignKey: "parentId" });
MobileCategory.belongsTo(Category, { as: "redirectTarget", foreignKey: "redirection_id" });

module.exports = MobileCategory;
