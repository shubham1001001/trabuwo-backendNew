const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const LeaveRequest = sequelize.define(
  "LeaveRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: true,
        isDate: true,
      },
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: true,
        isDate: true,
      },
    },
    reason: {
      type: DataTypes.ENUM(
        "unable_to_process_due_to_lockdown",
        "manpower_issue",
        "limited_inventory_stock_issue",
        "production_issue",
        "limited_packaging_materials_issue",
        "personal_reasons",
        "festive_holidays",
        "staff_self_suffering_from_covid",
        "local_strike"
      ),
      allowNull: false,
      validate: {
        notNull: true,
        notEmpty: true,
      },
    },
  },
  {
    tableName: "leave_requests",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LeaveRequest;
