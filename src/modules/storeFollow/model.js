const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const { Store } = require("../sellerOnboarding/model");
const { v7: uuidv7 } = require("uuid");

const StoreFollow = sequelize.define(
  "StoreFollow",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: () => uuidv7(),
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "store_id",
      references: {
        model: Store,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "store_follows",
    indexes: [
      {
        unique: true,
        fields: ["user_id", "store_id"],
        name: "unique_user_store_follow",
      },
    ],
  }
);

User.hasMany(StoreFollow, {
  foreignKey: "userId",
  as: "storeFollows",
  onDelete: "CASCADE",
});

Store.hasMany(StoreFollow, {
  foreignKey: "storeId",
  as: "followers",
  onDelete: "CASCADE",
});

StoreFollow.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

StoreFollow.belongsTo(Store, {
  foreignKey: "storeId",
  as: "store",
});

module.exports = {
  StoreFollow,
};
