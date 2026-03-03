const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { Location } = require("../sellerOnboarding/model");
const { v7: uuidv7 } = require("uuid");

const UserAddress = sequelize.define(
  "UserAddress",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    publicId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: () => uuidv7(),
    },
    userId: { type: DataTypes.BIGINT, allowNull: false },
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: false },
    buildingNumber: { type: DataTypes.STRING },
    street: { type: DataTypes.STRING },
    landmark: { type: DataTypes.STRING },
    addressType: {
      type: DataTypes.ENUM("home", "work", "other"),
      allowNull: false,
      defaultValue: "home",
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "user_addresses",
  }
);

User.hasMany(UserAddress, {
  foreignKey: "userId",
  as: "addresses",
  onDelete: "CASCADE",
});

UserAddress.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

UserAddress.belongsTo(Location, {
  foreignKey: "locationId",
  as: "location",
});

module.exports = {
  UserAddress,
};
