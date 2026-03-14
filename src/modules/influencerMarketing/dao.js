const { InfluencerOptIn, InfluencerPromotion ,InfluencerContent} = require("./model");
const { NotFoundError, ConflictError } = require("../../utils/errors");
const catalogueService = require("../catalogue/service");
const Catalogue = require("../catalogue/model");
const Category = require("../category/model");
const { Product, ProductImage, ProductVariant } = require("../product/model");
const { Op } = require("sequelize");

class InfluencerMarketingDAO {
  async createOptIn(sellerId, options = {}) {
    const existing = await InfluencerOptIn.findOne({ where: { sellerId } });
    if (existing) {
      throw new ConflictError("Seller already opted in");
    }
    return InfluencerOptIn.create({ sellerId }, options);
  }

  async deleteOptIn(sellerId, options = {}) {
    return InfluencerOptIn.destroy({ where: { sellerId }, ...options });
  }

  async getOptIns(status) {
    const where = status ? { status } : {};
    return InfluencerOptIn.findAll({ where });
  }

  async updateOptInStatus(id, status) {
    const optIn = await InfluencerOptIn.findByPk(id);
    if (!optIn) throw new NotFoundError("Opt-in not found");
    await optIn.update({ status });
    return optIn;
  }

  async createInfluencerPromotion({
    influencerId,
    sellerId,
    productId,
    catalogueId,
  }) {
    const existing = await InfluencerPromotion.findOne({
      where: { influencerId, sellerId, productId },
    });
    if (existing) throw new ConflictError("Already selected");
    return InfluencerPromotion.create({
      influencerId,
      sellerId,
      productId,
      catalogueId,
    });
  }

  async getInfluencerPromotions(influencerId) {
    return InfluencerPromotion.findAll({ where: { influencerId } });
  }

  async addCatalogs(catalogues, options = {}) {
    return InfluencerPromotion.bulkCreate(catalogues, options);
  }

  async updateCommissions(updates) {
    const results = [];
    for (const update of updates) {
      const promotion = await InfluencerPromotion.findByPk(update.id);
      if (!promotion) {
        throw new NotFoundError(
          `InfluencerPromotion with id ${update.id} not found`
        );
      }
      await promotion.update({ commission: update.commission });
      results.push(promotion);
    }
    return results;
  }

  async updateStatus(ids, status) {
    const result = await InfluencerPromotion.update(
      { status },
      {
        where: { catalogueId: ids },
        returning: true,
      }
    );
    return result;
  }

  async getPromotionsByCatalogueIds(catalogueIds) {
    return InfluencerPromotion.findAll({
      where: { catalogueId: catalogueIds },
      include: [
        {
          model: require("../catalogue/model"),
          as: "catalogue",
          attributes: ["id", "name", "status"],
        },
      ],
    });
  }

  async deleteAllCataloguesByUserId(userId, options = {}) {
    const catalogueIds = await catalogueService.getCatalogueIdsByUserId(userId);

    if (!catalogueIds || catalogueIds.length === 0) {
      return { deletedCount: 0, message: "No catalogues found for this user" };
    }

    const deletedCount = await InfluencerPromotion.destroy({
      where: { catalogueId: catalogueIds },
      ...options,
    });
    return { deletedCount, catalogueIds };
  }

  async getAllInfluencerPromotions(filters = {}, pagination = {}, userId) {
    const { page = 1, limit = 10 } = pagination;
    const { status, catalogueId } = filters;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const catalogueWhere = { userId };
    if (catalogueId) {
      catalogueWhere.id = catalogueId;
    }

    const count = await InfluencerPromotion.count({
      where: whereClause,
      include: [
        {
          model: Catalogue,
          as: "catalogue",
          where: catalogueWhere,
          attributes: [],
        },
      ],
    });

    const rows = await InfluencerPromotion.findAll({
      where: whereClause,
      include: [
        {
          model: Catalogue,
          as: "catalogue",
          where: catalogueWhere,
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name"],
            },
            {
              model: Product,
              as: "products",
              where: { isDeleted: false },
              required: false,
              attributes: ["id", "name"],
              include: [
                {
                  model: ProductImage,
                  as: "images",
                  where: { isDeleted: false },
                  required: false,
                  attributes: ["id", "imageUrl", "sortOrder"],
                  order: [["sortOrder", "ASC"]],
                },
                {
                  model: ProductVariant,
                  as: "variants",
                  where: { isDeleted: false },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      promotions: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  async getCataloguesNotInPromotions(pagination = {}, userId) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const existingPromotionIds = await InfluencerPromotion.findAll({
      attributes: ["catalogueId"],
      raw: true,
    });

    const existingCatalogueIds = existingPromotionIds.map(
      (promotion) => promotion.catalogueId
    );

    const countResult = await Catalogue.count({
      where: {
        isDeleted: false,
        userId: userId,
        id: {
          [Op.notIn]:
            existingCatalogueIds.length > 0 ? existingCatalogueIds : [0],
        },
      },
    });

    const rows = await Catalogue.findAll({
      where: {
        isDeleted: false,
        userId: userId,
        id: {
          [Op.notIn]:
            existingCatalogueIds.length > 0 ? existingCatalogueIds : [0],
        },
      },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
        {
          model: Product,
          as: "products",
          where: { isDeleted: false },
          required: false,
          attributes: ["id", "name"],
          include: [
            {
              model: ProductImage,
              as: "images",
              where: { isDeleted: false },
              required: false,
              attributes: ["id", "imageUrl", "sortOrder"],
              order: [["sortOrder", "ASC"]],
            },
            {
              model: ProductVariant,
              as: "variants",
              where: { isDeleted: false },
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      catalogues: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult / limit),
        totalItems: countResult,
        itemsPerPage: parseInt(limit),
      },
    };
  }


async createInfluencerContent(data) {
  return InfluencerContent.create(data);
}
}

module.exports = new InfluencerMarketingDAO();
