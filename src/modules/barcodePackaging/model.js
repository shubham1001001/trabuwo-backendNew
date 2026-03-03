const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { v7: uuidv7 } = require("uuid");

const barcodePackagingVendor = sequelize.define(
  "barcodePackagingVendor",
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
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imgS3Key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pricePerPacket: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    redirectUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "barcode_packaging_vendors",
    underscored: true,
    timestamps: true,
  }
);

module.exports = barcodePackagingVendor;
