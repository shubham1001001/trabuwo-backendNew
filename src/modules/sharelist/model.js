const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const Catalogue = require("../catalogue/model");

const SharelistItem = sequelize.define(
  "SharelistItem",
  {
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: User,
        key: "id",
      },
    },
    catalogueId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: Catalogue,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    tableName: "sharelist_items",
    underscored: true,
  }
);

SharelistItem.belongsTo(User, { foreignKey: "userId", as: "user" });
SharelistItem.belongsTo(Catalogue, {
  foreignKey: "catalogueId",
  as: "catalogue",
});

module.exports = SharelistItem;
