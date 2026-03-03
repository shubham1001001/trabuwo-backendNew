const { Campaign, CampaignCatalogue } = require("./model");
const Catalogue = require("../catalogue/model");
const Category = require("../category/model");
const { Product, ProductImage } = require("../product/model");
const sequelize = require("../../config/database");
const { Op } = require("sequelize");
const { ValidationError } = require("../../utils/errors");

const createCampaign = async (campaignData) => {
  return await sequelize.transaction(async (t) => {
    const { catalogues, ...campaignFields } = campaignData;

    const campaign = await Campaign.create(campaignFields, {
      transaction: t,
    });
    const catalogueIds = catalogues.map((c) => c.catalogueId);
    const userCatalogues = await Catalogue.findAll({
      where: {
        id: catalogueIds,
        userId: campaignFields.userId,
      },
      transaction: t,
    });

    if (userCatalogues.length !== catalogueIds.length) {
      throw new ValidationError(
        "One or more catalogueIds do not belong to the user"
      );
    }

    const campaignCatalogues = catalogues.map((catalogue) => ({
      campaignId: campaign.id,
      catalogueId: catalogue.catalogueId,
      costPerClick: catalogue.costPerClick,
    }));

    await CampaignCatalogue.bulkCreate(campaignCatalogues, {
      transaction: t,
    });

    return await getCampaignById(campaign.id, { transaction: t });
  });
};

const getCampaignById = async (id, options = {}) => {
  return await Campaign.findByPk(id, {
    include: [
      {
        association: "campaignCatalogues",
        include: [{ association: "catalogue" }],
      },
    ],
    ...options,
  });
};

const getAllCampaigns = async (filters = {}) => {
  // TODO : improve this query
  const whereClause = {};

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.userId) {
    whereClause.userId = filters.userId;
  }

  const { page, limit } = filters;

  if (page && limit) {
    const offset = (page - 1) * limit;

    const { count } = await Campaign.findAndCountAll({
      where: whereClause,
    });

    const rows = await Campaign.findAll({
      where: whereClause,
      include: [
        {
          model: CampaignCatalogue,
          as: "campaignCatalogues",
          include: [
            {
              model: Catalogue,
              as: "catalogue",
              include: [
                { model: Category, as: "category" },
                {
                  model: Product,
                  as: "products",
                  include: [{ model: ProductImage, as: "images" }],
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return {
      campaigns: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        total: count,
        limit,
      },
    };
  }
};
const updateCampaign = async (id, updateData) => {
  const [updatedRowsCount] = await Campaign.update(updateData, {
    where: { id },
  });
  return updatedRowsCount > 0;
};

const deleteCampaign = async (id) => {
  return await Campaign.destroy({
    where: { id },
  });
};

const getCampaignCatalogueById = async (id) => {
  return await CampaignCatalogue.findByPk(id);
};

const getCampaignCataloguesByCampaignId = async (campaignId) => {
  return await CampaignCatalogue.findAll({
    where: { campaignId },
    include: [{ association: "catalogue" }],
  });
};

const updateCampaignCatalogue = async (id, updateData, userId) => {
  const campaignCatalogue = await CampaignCatalogue.findByPk(id, {
    include: [
      {
        model: Campaign,
        as: "campaign",
        where: { userId },
        attributes: ["id", "userId"],
      },
    ],
  });

  if (!campaignCatalogue) {
    throw new ValidationError(
      "Campaign catalogue not found or does not belong to the user"
    );
  }

  const [updatedRowsCount, updatedCampaignCatalogue] =
    await CampaignCatalogue.update(updateData, {
      where: { id },
      returning: true,
    });
  return updatedRowsCount > 0 ? updatedCampaignCatalogue[0] : null;
};

const deleteCampaignCatalogue = async (id) => {
  return await CampaignCatalogue.destroy({
    where: { id },
  });
};

const getAvailableCatalogues = async (filters = {}) => {
  const whereClause = {
    isDeleted: false,
  };

  if (filters.userId) {
    whereClause.userId = filters.userId;
  }

  const campaignCatalogueIds = await CampaignCatalogue.findAll({
    attributes: ["catalogueId"],
    include: [
      {
        model: Campaign,
        as: "campaign",
        where: { userId: filters.userId },
        attributes: [],
      },
    ],
    raw: true,
  });

  const usedCatalogueIds = campaignCatalogueIds.map((cc) => cc.catalogueId);

  if (usedCatalogueIds.length > 0) {
    whereClause.id = {
      [Op.notIn]: usedCatalogueIds,
    };
  }

  const { page, limit } = filters;

  const offset = (page - 1) * limit;

  const count = await Catalogue.count({
    where: whereClause,
  });

  const rows = await Catalogue.findAll({
    where: whereClause,
    include: [
      {
        model: Category,
        as: "category",
      },
      {
        model: Product,
        as: "products",
        include: [{ model: ProductImage, as: "images" }],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    catalogues: rows,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      total: count,
      limit,
    },
  };
};

const restartCampaign = async (campaignId, userId, catalogueData) => {
  return await sequelize.transaction(async (t) => {
    const campaign = await Campaign.findOne({
      where: { id: campaignId, userId },
      transaction: t,
    });

    if (!campaign) {
      throw new ValidationError(
        "Campaign not found or does not belong to the user"
      );
    }

    const existingCampaignCatalogues = await CampaignCatalogue.findAll({
      where: { campaignId },
      attributes: ["id", "campaignId", "catalogueId", "costPerClick"],
      transaction: t,
    });

    const existingCatalogueIds = existingCampaignCatalogues.map((cc) => cc.id);
    const newCatalogueIds = catalogueData.map((cd) => cd.campaignCatalogueId);

    const cataloguesToDelete = existingCatalogueIds.filter(
      (id) => !newCatalogueIds.includes(id)
    );

    const cataloguesToUpdate = catalogueData.filter((cd) =>
      existingCatalogueIds.includes(cd.campaignCatalogueId)
    );

    if (cataloguesToDelete.length > 0) {
      await CampaignCatalogue.destroy({
        where: { id: { [Op.in]: cataloguesToDelete } },
        transaction: t,
      });
    }

    if (cataloguesToUpdate.length > 0) {
      const existingCataloguesMap = new Map(
        existingCampaignCatalogues.map((cc) => [cc.id, cc])
      );

      const cataloguesToBulkUpdate = cataloguesToUpdate.map((cat) => {
        const existing = existingCataloguesMap.get(cat.campaignCatalogueId);
        return {
          id: cat.campaignCatalogueId,
          campaignId: existing.campaignId,
          catalogueId: existing.catalogueId,
          costPerClick: cat.costPerClick,
        };
      });

      await CampaignCatalogue.bulkCreate(cataloguesToBulkUpdate, {
        updateOnDuplicate: ["costPerClick"],
        transaction: t,
      });
    }

    await Campaign.update(
      { status: "live" },
      {
        where: { id: campaignId },
        transaction: t,
      }
    );

    return await getCampaignById(campaignId, { transaction: t });
  });
};

module.exports = {
  createCampaign,
  getCampaignById,
  getAllCampaigns,
  updateCampaign,
  deleteCampaign,
  getCampaignCatalogueById,
  getCampaignCataloguesByCampaignId,
  updateCampaignCatalogue,
  deleteCampaignCatalogue,
  getAvailableCatalogues,
  restartCampaign,
};
