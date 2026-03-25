const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Brand = sequelize.define(
  "Brand",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    publicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: "public_id",
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING,
    },

    logoUrl: {
      type: DataTypes.TEXT,
      field: "logo_url",
    },

    bannerUrl: {
      type: DataTypes.TEXT,
      field: "banner_url",
    },

    description: {
      type: DataTypes.TEXT,
    },

    websiteUrl: {
      type: DataTypes.TEXT,
      field: "website_url",
    },

    status: {
      type: DataTypes.ENUM("active", "deleted"),
      defaultValue: "active",
    },

    

    createdBy: {
      type: DataTypes.BIGINT,
      field: "created_by",
    },

    updatedBy: {
      type: DataTypes.BIGINT,
      field: "updated_by",
    },
  },
  {
    tableName: "brands",
    underscored: true,
  }
);

module.exports = Brand;