const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");

const TrainingSlot = sequelize.define(
  "TrainingSlot",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
    },
    language: {
      type: DataTypes.ENUM("ENGLISH", "HINDI"),
      allowNull: false,
    },
    startTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isBooked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "training_slots",
  }
);

TrainingSlot.belongsTo(User, { foreignKey: "userId", as: "bookedBy" });
User.hasMany(TrainingSlot, { foreignKey: "userId", as: "trainingBookings" });

module.exports = { TrainingSlot };
