const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { v7: uuidv7 } = require("uuid");
const { encrypt, decrypt, getDefaultKeyVersion } = require("../../utils/encryption");

const UserBankInfo = sequelize.define(
  "UserBankInfo",
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
      defaultValue: () => uuidv7(),
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    encryptedBankAccountNumber: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "encrypted_bank_account_number",
      get() {
        const encryptedValue = this.getDataValue("encryptedBankAccountNumber");
        if (!encryptedValue) return null;
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        try {
          return decrypt(encryptedValue, keyVersion);
        } catch (error) {
          throw new Error(`Failed to decrypt bank account number: ${error.message}`);
        }
      },
      set(value) {
        if (!value) {
          this.setDataValue("encryptedBankAccountNumber", null);
          return;
        }
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        const encrypted = encrypt(value, keyVersion);
        this.setDataValue("encryptedBankAccountNumber", encrypted);
      },
    },
    encryptedBankIfsc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "encrypted_bank_ifsc",
      get() {
        const encryptedValue = this.getDataValue("encryptedBankIfsc");
        if (!encryptedValue) return null;
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        try {
          return decrypt(encryptedValue, keyVersion);
        } catch (error) {
          throw new Error(`Failed to decrypt bank IFSC: ${error.message}`);
        }
      },
      set(value) {
        if (!value) {
          this.setDataValue("encryptedBankIfsc", null);
          return;
        }
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        const encrypted = encrypt(value, keyVersion);
        this.setDataValue("encryptedBankIfsc", encrypted);
      },
    },
    encryptedBankAccountHolderName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "encrypted_bank_account_holder_name",
      get() {
        const encryptedValue = this.getDataValue("encryptedBankAccountHolderName");
        if (!encryptedValue) return null;
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        try {
          return decrypt(encryptedValue, keyVersion);
        } catch (error) {
          throw new Error(`Failed to decrypt bank account holder name: ${error.message}`);
        }
      },
      set(value) {
        if (!value) {
          this.setDataValue("encryptedBankAccountHolderName", null);
          return;
        }
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        const encrypted = encrypt(value, keyVersion);
        this.setDataValue("encryptedBankAccountHolderName", encrypted);
      },
    },
    encryptedUpiId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "encrypted_upi_id",
      get() {
        const encryptedValue = this.getDataValue("encryptedUpiId");
        if (!encryptedValue) return null;
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        try {
          return decrypt(encryptedValue, keyVersion);
        } catch (error) {
          throw new Error(`Failed to decrypt UPI ID: ${error.message}`);
        }
      },
      set(value) {
        if (!value) {
          this.setDataValue("encryptedUpiId", null);
          return;
        }
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        const encrypted = encrypt(value, keyVersion);
        this.setDataValue("encryptedUpiId", encrypted);
      },
    },
    encryptedUpiName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "encrypted_upi_name",
      get() {
        const encryptedValue = this.getDataValue("encryptedUpiName");
        if (!encryptedValue) return null;
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        try {
          return decrypt(encryptedValue, keyVersion);
        } catch (error) {
          throw new Error(`Failed to decrypt UPI name: ${error.message}`);
        }
      },
      set(value) {
        if (!value) {
          this.setDataValue("encryptedUpiName", null);
          return;
        }
        const keyVersion = this.getDataValue("keyVersion") || getDefaultKeyVersion();
        const encrypted = encrypt(value, keyVersion);
        this.setDataValue("encryptedUpiName", encrypted);
      },
    },
    bankAccountNumberIndex: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "bank_account_number_index",
    },
    bankIfscIndex: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "bank_ifsc_index",
    },
    upiIdIndex: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "upi_id_index",
    },
    keyVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: () => getDefaultKeyVersion(),
      field: "key_version",
    },
  },
  {
    tableName: "user_bank_infos",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ["user_id"],
        unique: true,
      },
      {
        fields: ["public_id"],
        unique: true,
      },
      {
        fields: ["bank_account_number_index"],
      },
      {
        fields: ["bank_ifsc_index"],
      },
      {
        fields: ["upi_id_index"],
      },
    ],
  }
);

User.hasOne(UserBankInfo, {
  foreignKey: "userId",
  as: "bankInfo",
  onDelete: "CASCADE",
});
UserBankInfo.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = { UserBankInfo };
