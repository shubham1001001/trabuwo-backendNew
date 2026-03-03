const dao = require("./dao");
const sequelize = require("../../config/database");
const { NotFoundError, ValidationError } = require("../../utils/errors");

class InventoryService {
  async getCataloguesWithProducts(filters, userId) {
    const {
      status,
      stockFilter,
      blockReasonFilter,
      catalogueId,
      categoryId,
      page,
      limit,
    } = filters;

    if (status === "active" && blockReasonFilter) {
      throw new ValidationError(
        "Block reason filter not applicable for active status"
      );
    }

    if (status === "blocked" && stockFilter) {
      throw new ValidationError(
        "Stock filter not applicable for blocked status"
      );
    }

    if (status === "paused" && (stockFilter || blockReasonFilter)) {
      throw new ValidationError(
        "Secondary filters not applicable for paused status"
      );
    }

    if (status === "activation_pending" && (stockFilter || blockReasonFilter)) {
      throw new ValidationError(
        "Secondary filters not applicable for activation pending status"
      );
    }

    if (catalogueId) {
      const catalogue = await dao.getCatalogueByIdAndUserId(
        catalogueId,
        userId
      );
      if (!catalogue) {
        throw new NotFoundError(
          "Catalogue not found or you don't have permission to access it"
        );
      }
    }

    if (categoryId) {
      const categoryExists = await dao.getCategoryByIdAndUserId(
        categoryId,
        userId
      );
      if (!categoryExists) {
        throw new NotFoundError(
          "Category not found or you don't have permission to access it"
        );
      }
    }

    return await dao.getCataloguesWithProducts(
      filters,
      { page, limit },
      userId
    );
  }

  async updateProductStock(productId, newStock, userId) {
    const product = await dao.updateProductStock(productId, newStock, userId);
    return product;
  }

  async bulkPauseProducts(catalogueId, productIds, userId) {
    return await sequelize.transaction(async (t) => {
      const result = await dao.bulkPauseProducts(
        catalogueId,
        productIds,
        userId,
        {
          transaction: t,
        }
      );
      return result;
    });
  }

  async getUserCategoryTree(userId) {
    return await dao.getUserCategoryTree(userId);
  }
}

module.exports = new InventoryService();
