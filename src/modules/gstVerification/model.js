const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { SellerOnboarding } = require("../sellerOnboarding/model");
const { v7: uuidv7 } = require("uuid");

const GstVerification = sequelize.define(
  "GstVerification",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: () => uuidv7(),
    },
    sellerOnboardingId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    idType: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    idValue: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    gstin: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    legalName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tradeName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    registrationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    taxpayerType: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    einvoiceStatus: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    principalAddressAdr: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    principalAddressLoc: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    principalAddressPincode: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    principalAddressState: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    principalAddressDistrict: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    principalAddressStreet: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    principalAddressCity: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    rawData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "gst_verifications",
  }
);

GstVerification.belongsTo(SellerOnboarding, {
  foreignKey: "sellerOnboardingId",
  as: "sellerOnboarding",
  onDelete: "CASCADE",
});

module.exports = {
  GstVerification,
};

