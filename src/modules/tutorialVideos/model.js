const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const TutorialVideo = sequelize.define(
  "TutorialVideo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        isUrl: true,
      },
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    section: {
      type: DataTypes.ENUM(
        "most_watched",
        "new_lessons",
        "registration",
        "getting_started",
        "how_to_start",
        "create_listing",
        "handling_operations",
        "growing_sales",
        "payments_and_penalties",
        "improve_sales",
        "advertising_products",
        "managing_operations"
      ),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "tutorial_videos",
    underscored: true,
    timestamps: true,
  }
);

module.exports = TutorialVideo;
