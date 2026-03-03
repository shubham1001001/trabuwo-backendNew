const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const Catalogue = require("../catalogue/model");

const InfluencerOptIn = sequelize.define(
  "InfluencerOptIn",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sellerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: {
        model: User,
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      defaultValue: "PENDING",
    },
  },
  {
    tableName: "influencer_opt_ins",
    timestamps: true,
    underscored: true,
  }
);

const InfluencerPromotion = sequelize.define(
  "InfluencerPromotion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    catalogueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: Catalogue,
        key: "id",
      },
    },
    commission: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("SELECTED", "ACTIVE", "INACTIVE"),
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "influencer_promotions",
    timestamps: true,
    underscored: true,
  }
);

const InfluencerContent = sequelize.define(
  "InfluencerContent",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    influencerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    contentLink: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contentType: {
      type: DataTypes.ENUM("POST", "REEL", "VIDEO"),
      allowNull: false,
    },
  },
  {
    tableName: "influencer_contents",
    timestamps: true,
    underscored: true,
  }
);

InfluencerOptIn.belongsTo(User, {
  as: "seller",
  foreignKey: "sellerId",
});

User.hasMany(InfluencerOptIn, {
  as: "influencerOptIns",
  foreignKey: "sellerId",
});

InfluencerPromotion.belongsTo(Catalogue, {
  as: "catalogue",
  foreignKey: "catalogueId",
});

Catalogue.hasMany(InfluencerPromotion, {
  as: "influencerPromotions",
  foreignKey: "catalogueId",
});

InfluencerContent.belongsTo(User, {
  as: "influencer",
  foreignKey: "influencerId",
});

User.hasMany(InfluencerContent, {
  as: "influencerContents",
  foreignKey: "influencerId",
});

module.exports = {
  InfluencerOptIn,
  InfluencerPromotion,
  InfluencerContent,
};
