const promotionDAO = require("./dao");
const { ValidationError } = require("../../utils/errors");

class PromotionService {
  async createPromotion(promotionData) {
    const promotion = await promotionDAO.createPromotion(promotionData);
    return promotion;
  }

  async getAllPromotions(filters) {
    const promotions = await promotionDAO.getAllPromotions(filters);
    return promotions;
  }

  async getPromotionById(id) {
    const promotion = await promotionDAO.getPromotionById(id);
    return promotion;
  }

  async updatePromotion(id, updateData) {
    const promotion = await promotionDAO.updatePromotion(id, updateData);
    return promotion;
  }

  async deletePromotion(id) {
    const result = await promotionDAO.deletePromotion(id);
    return result;
  }

  async registerSeller(promotionId, sellerId) {
    const registration = await promotionDAO.registerSeller(
      promotionId,
      sellerId
    );
    return registration;
  }

  async getPromotionSellers(promotionId) {
    const sellers = await promotionDAO.getPromotionSellers(promotionId);
    return sellers;
  }

  async approveSeller(promotionId, sellerId, approvedBy) {
    const registration = await promotionDAO.updateSellerStatus(
      promotionId,
      sellerId,
      "APPROVED",
      approvedBy
    );
    return registration;
  }

  async rejectSeller(promotionId, sellerId, approvedBy) {
    const registration = await promotionDAO.updateSellerStatus(
      promotionId,
      sellerId,
      "REJECTED",
      approvedBy
    );
    return registration;
  }

  async addProduct(promotionId, productData, userId) {
    if (productData.discountPercent < 0 || productData.discountPercent > 100) {
      throw new ValidationError("Discount percent must be between 0 and 100");
    }

    if (
      productData.returnDefectiveDiscountPercent < 0 ||
      productData.returnDefectiveDiscountPercent > 100
    ) {
      throw new ValidationError(
        "Return/defective discount percent must be between 0 and 100"
      );
    }

    const product = await promotionDAO.addProduct(
      promotionId,
      productData,
      userId
    );
    return product;
  }

  async addMultipleProducts(promotionId, productsData, userId) {
    for (const product of productsData) {
      if (product.discountPercent < 0 || product.discountPercent > 100) {
        throw new ValidationError(
          `Discount percent must be between 0 and 100 for product ${product.productId}`
        );
      }

      if (
        product.returnDefectiveDiscountPercent < 0 ||
        product.returnDefectiveDiscountPercent > 100
      ) {
        throw new ValidationError(
          `Return/defective discount percent must be between 0 and 100 for product ${product.productId}`
        );
      }
    }

    const products = await promotionDAO.addMultipleProducts(
      promotionId,
      productsData,
      userId
    );
    return products;
  }

  async updateMultipleProductDiscounts(promotionId, productsData, userId) {
    // Validate all discount updates before processing
    for (const product of productsData) {
      if (product.discountPercent < 0 || product.discountPercent > 100) {
        throw new ValidationError(
          `Discount percent must be between 0 and 100 for product ${product.productId}`
        );
      }

      if (
        product.returnDefectiveDiscountPercent < 0 ||
        product.returnDefectiveDiscountPercent > 100
      ) {
        throw new ValidationError(
          `Return/defective discount percent must be between 0 and 100 for product ${product.productId}`
        );
      }
    }

    const result = await promotionDAO.updateMultipleProductDiscounts(
      promotionId,
      productsData,
      userId
    );
    return result;
  }

  async removeProduct(promotionId, productId, sellerId) {
    const result = await promotionDAO.removeProduct(
      promotionId,
      productId,
      sellerId
    );
    return result;
  }

  async removeMultipleProducts(promotionId, productIds, sellerId) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new ValidationError(
        "Product IDs array is required and cannot be empty"
      );
    }

    const result = await promotionDAO.removeMultipleProducts(
      promotionId,
      productIds,
      sellerId
    );
    return result;
  }

  async removeAllProducts(promotionId, sellerId) {
    const result = await promotionDAO.removeAllProducts(promotionId, sellerId);
    return result;
  }

  async getPromotionProducts(promotionId, userId) {
    const products = await promotionDAO.getPromotionProducts(
      promotionId,
      userId
    );
    return products;
  }

  async getActivePromotions() {
    const promotions = await promotionDAO.getActivePromotions();
    return promotions;
  }

  async updatePromotionStatus(id, status) {
    const promotion = await promotionDAO.getPromotionById(id);

    if (status === "ACTIVE") {
      const currentDate = new Date();
      if (promotion.startDate > currentDate) {
        throw new ValidationError(
          "Cannot activate promotion before start date"
        );
      }
      if (promotion.endDate < currentDate) {
        throw new ValidationError("Cannot activate expired promotion");
      }
    }

    const updatedPromotion = await promotionDAO.updatePromotion(id, { status });
    return updatedPromotion;
  }

  async getProductsNotInPromotions(promotionId, pagination = {}, userId) {
    return await promotionDAO.getProductsNotInPromotions(
      promotionId,
      pagination,
      userId
    );
  }
}

module.exports = new PromotionService();
