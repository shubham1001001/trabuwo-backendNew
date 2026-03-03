const promotionService = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

class PromotionController {
  createPromotion = asyncHandler(async (req, res) => {
    const promotion = await promotionService.createPromotion(req.body);
    return apiResponse.success(
      res,
      "Promotion created successfully",
      promotion
    );
  });

  getAllPromotions = asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      isActive:
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined,
      userId: req.user.id,
    };

    const promotions = await promotionService.getAllPromotions(filters);
    return apiResponse.success(
      res,
      "Promotions retrieved successfully",
      promotions
    );
  });

  getPromotionById = asyncHandler(async (req, res) => {
    const promotion = await promotionService.getPromotionById(req.params.id);
    return apiResponse.success(
      res,
      "Promotion retrieved successfully",
      promotion
    );
  });

  updatePromotion = asyncHandler(async (req, res) => {
    const promotion = await promotionService.updatePromotion(
      req.params.id,
      req.body
    );
    return apiResponse.success(
      res,
      "Promotion updated successfully",
      promotion
    );
  });

  deletePromotion = asyncHandler(async (req, res) => {
    await promotionService.deletePromotion(req.params.id);
    return apiResponse.success(res, "Promotion deleted successfully");
  });

  registerSeller = asyncHandler(async (req, res) => {
    const registration = await promotionService.registerSeller(
      req.params.id,
      req.user.id
    );
    return apiResponse.success(
      res,
      "Seller registered successfully",
      registration
    );
  });

  getPromotionSellers = asyncHandler(async (req, res) => {
    const sellers = await promotionService.getPromotionSellers(req.params.id);
    return apiResponse.success(res, "Sellers retrieved successfully", sellers);
  });

  approveSeller = asyncHandler(async (req, res) => {
    const registration = await promotionService.approveSeller(
      req.params.id,
      req.params.sellerId,
      req.user.id
    );
    return apiResponse.success(
      res,
      "Seller approved successfully",
      registration
    );
  });

  rejectSeller = asyncHandler(async (req, res) => {
    const registration = await promotionService.rejectSeller(
      req.params.id,
      req.params.sellerId,
      req.user.id
    );
    return apiResponse.success(
      res,
      "Seller rejected successfully",
      registration
    );
  });

  addProduct = asyncHandler(async (req, res) => {
    const product = await promotionService.addProduct(
      req.params.id,
      req.body,
      req.user.id
    );
    return apiResponse.success(res, "Product added successfully", product);
  });

  addMultipleProducts = asyncHandler(async (req, res) => {
    const products = await promotionService.addMultipleProducts(
      req.params.id,
      req.body.products,
      req.user.id
    );
    return apiResponse.success(res, "Products added successfully", products);
  });

  updateMultipleProductDiscounts = asyncHandler(async (req, res) => {
    const result = await promotionService.updateMultipleProductDiscounts(
      req.params.id,
      req.body.products,
      req.user.id
    );
    return apiResponse.success(
      res,
      "Product discounts updated successfully",
      result
    );
  });

  removeProduct = asyncHandler(async (req, res) => {
    await promotionService.removeProduct(
      req.params.id,
      req.params.productId,
      req.user.id
    );
    return apiResponse.success(res, "Product removed successfully");
  });

  removeMultipleProducts = asyncHandler(async (req, res) => {
    const result = await promotionService.removeMultipleProducts(
      req.params.id,
      req.body.productIds,
      req.user.id
    );
    return apiResponse.success(res, "Products removed successfully", {
      removedCount: result,
    });
  });

  removeAllProducts = asyncHandler(async (req, res) => {
    const result = await promotionService.removeAllProducts(
      req.params.id,
      req.user.id
    );
    return apiResponse.success(res, "All products removed successfully", {
      removedCount: result,
    });
  });

  getPromotionProducts = asyncHandler(async (req, res) => {
    const products = await promotionService.getPromotionProducts(
      req.params.id,
      req.user.id
    );
    return apiResponse.success(
      res,
      "Products retrieved successfully",
      products
    );
  });

  getActivePromotions = asyncHandler(async (req, res) => {
    const promotions = await promotionService.getActivePromotions();
    return apiResponse.success(
      res,
      "Active promotions retrieved successfully",
      promotions
    );
  });

  updatePromotionStatus = asyncHandler(async (req, res) => {
    const promotion = await promotionService.updatePromotionStatus(
      req.params.id,
      req.body.status
    );
    return apiResponse.success(
      res,
      "Promotion status updated successfully",
      promotion
    );
  });

  getProductsNotInPromotions = asyncHandler(async (req, res) => {
    const { promotionId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pagination = { page, limit };

    const result = await promotionService.getProductsNotInPromotions(
      promotionId,
      pagination,
      req.user.id
    );
    return apiResponse.success(
      res,
      result,
      "Products not in promotion retrieved successfully"
    );
  });
}

module.exports = new PromotionController();
