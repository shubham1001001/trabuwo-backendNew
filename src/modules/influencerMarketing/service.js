const dao = require("./dao");
const catalogueService = require("../catalogue/service");
const sequelize = require("../../config/database");
const { ValidationError } = require("../../utils/errors");

class InfluencerMarketingService {
  async optIn(sellerId, options = {}) {
    return dao.createOptIn(sellerId, options);
  }

  async getOptIns(status) {
    return dao.getOptIns(status);
  }

  async approveOptIn(id, status) {
    return dao.updateOptInStatus(id, status);
  }

  async selectProduct({ influencerId, sellerId, productId, catalogueId }) {
    return dao.createInfluencerPromotion({
      influencerId,
      sellerId,
      productId,
      catalogueId,
    });
  }

  async getInfluencerPromotions(influencerId) {
    return dao.getInfluencerPromotions(influencerId);
  }

  async addCatalogs(catalogues, userId, options = {}) {
    const catalogueIds = await catalogueService.getCatalogueIdsByUserId(userId);
    const invalidIds = catalogues.filter(
      (catalogue) => !catalogueIds.includes(`${catalogue.catalogueId}`)
    );

    if (invalidIds.length > 0) {
      throw new ValidationError(
        `Some catalogues are not associated with your catalogues: ${invalidIds.join(
          ", "
        )}`
      );
    }
    return dao.addCatalogs(catalogues, options);
  }

  async updateCommissions(updates) {
    return dao.updateCommissions(updates);
  }

  async updateStatus(ids, status, userId) {
    const catalogueIds = await catalogueService.getCatalogueIdsByUserId(userId);
    const invalidIds = ids.filter((id) => !catalogueIds.includes(id));
    if (invalidIds.length > 0) {
      throw new ValidationError(
        `Some ids are not associated with your catalogues: ${invalidIds.join(
          ", "
        )}`
      );
    }
    return dao.updateStatus(ids, status);
  }

  async optInFromMobile(sellerId) {
    return sequelize.transaction(async (t) => {
      const optIn = await this.optIn(sellerId, { transaction: t });
      const catalogueIds = await catalogueService.getCatalogueIdsByUserId(
        sellerId,
        { transaction: t }
      );
      const cataloguesForPromotion = catalogueIds.map((catalogue) => ({
        catalogueId: catalogue,
        commission: 10,
        status: "ACTIVE",
      }));

      const addedCatalogues = await this.addCatalogs(
        cataloguesForPromotion,
        sellerId,
        {
          transaction: t,
        }
      );

      return {
        optIn,
        addedCatalogues,
        totalCatalogues: catalogueIds.length,
      };
    });
  }

  async optOut(sellerId, options = {}) {
    return dao.deleteOptIn(sellerId, options);
  }

  async deleteAllCataloguesByUserId(userId) {
    return sequelize.transaction(async (t) => {
      const optOutResult = await this.optOut(userId, { transaction: t });
      const deletedResult = await dao.deleteAllCataloguesByUserId(userId, {
        transaction: t,
      });
      return {
        optOut: optOutResult,
        deletedCatalogues: deletedResult,
      };
    });
  }

  async getAllInfluencerPromotions(filters = {}, pagination = {}, userId) {
    return dao.getAllInfluencerPromotions(filters, pagination, userId);
  }

  async getCataloguesNotInPromotions(pagination = {}, userId) {
    return dao.getCataloguesNotInPromotions(pagination, userId);
  }
  


  async becomeInfluencer(userId) {
  return dao.becomeInfluencer(userId);
}


  async createReel({ influencerId, contentLink, contentType, catalogueId }) {
  if (catalogueId) {
    const catalogueIds = await catalogueService.getCatalogueIdsByUserId(
      influencerId
    );

    if (!catalogueIds.includes(`${catalogueId}`)) {
      throw new ValidationError(
        "The provided catalogueId is not associated with this influencer"
      );
    }
  }

  return dao.createInfluencerContent({
    influencerId,
    contentLink,
    contentType,
    catalogueId,
  });
}




}

module.exports = new InfluencerMarketingService();
