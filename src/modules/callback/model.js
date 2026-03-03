const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");

const Callback = sequelize.define(
  "Callback",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "success"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "callbacks",
    underscored: true,
    timestamps: true,
  }
);

module.exports = { Callback };
