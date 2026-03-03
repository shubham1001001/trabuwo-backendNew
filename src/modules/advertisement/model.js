const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { User } = require("../auth/model");
const Catalogue = require("../catalogue/model");

const Campaign = sequelize.define(
  "Campaign",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("live", "paused", "upcoming"),
      defaultValue: "upcoming",
    },
    totalBudget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    bidType: {
      type: DataTypes.ENUM("cost_per_click", "cost_per_ad_order"),
      allowNull: false,
    },
    dailyBudget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "campaigns",
    timestamps: true,
    underscored: true,
  }
);

const CampaignCatalogue = sequelize.define(
  "CampaignCatalogue",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Campaign,
        key: "id",
      },
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
    costPerClick: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "campaign_catalogues",
    timestamps: true,
    underscored: true,
  }
);

Campaign.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
});

User.hasMany(Campaign, {
  foreignKey: "userId",
  as: "campaigns",
});

Campaign.hasMany(CampaignCatalogue, {
  foreignKey: "campaignId",
  as: "campaignCatalogues",
});

CampaignCatalogue.belongsTo(Campaign, {
  foreignKey: "campaignId",
  as: "campaign",
});

Catalogue.hasOne(CampaignCatalogue, {
  foreignKey: "catalogueId",
  as: "campaignCatalogues",
});

CampaignCatalogue.belongsTo(Catalogue, {
  foreignKey: "catalogueId",
  as: "catalogue",
});

module.exports = {
  Campaign,
  CampaignCatalogue,
};
