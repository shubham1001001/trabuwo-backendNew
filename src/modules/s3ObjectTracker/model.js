const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const S3ObjectTracker = sequelize.define(
  "S3ObjectTracker",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    s3Key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("linked", "unlinked"),
      allowNull: false,
      defaultValue: "unlinked",
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "s3_object_trackers",
  }
);

module.exports = S3ObjectTracker;
