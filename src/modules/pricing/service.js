const dao = require("./dao");
const productDao = require("../product/dao");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require("../../utils/errors");
const redisService = require("../../services/redis");

exports.updateProductPrices = async (productId, priceData, userId) => {
  // Get product and verify ownership
  const product = await productDao.getProductById(productId);
  if (!product) {
    throw new NotFoundError("Product not found");
  }

  // Check if product belongs to user's catalogue
  if (product.catalogue.userId !== userId) {
    throw new ConflictError(
      "You can only update prices for products in your own catalogues"
    );
  }

  // Validate price data
  if (priceData.price !== undefined && priceData.price < 0) {
    throw new ValidationError("Price must be a positive number");
  }

  if (
    priceData.defectiveReturnPrice !== undefined &&
    priceData.defectiveReturnPrice < 0
  ) {
    throw new ValidationError(
      "Defective return price must be a positive number"
    );
  }

  // Update prices and create history
  const updatedProduct = await dao.updateProductPrices(
    productId,
    priceData,
    userId
  );

  return updatedProduct;
};

exports.getPricingStats = async (userId) => {
  return dao.getPricingStats(userId);
};

exports.getViewLossStats = async (userId) => {
  const stats = await dao.getProductsLosingViews(userId);

  return {
    productsLosingViews: stats.productsLosingViews,
    totalProducts: stats.totalProducts,
    percentageLosingViews:
      stats.totalProducts > 0
        ? ((stats.productsLosingViews / stats.totalProducts) * 100).toFixed(1)
        : 0,
  };
};

// Product view tracking methods
exports.incrementProductView = async (productId) => {
  return await redisService.incrementProductView(productId);
};

exports.getProductViewCount = async (productId, date) => {
  return await redisService.getProductViewCount(productId, date);
};

exports.getAllProductViews = async () => {
  return await redisService.getAllProductViews();
};

exports.clearProductViews = async () => {
  return await redisService.clearProductViews();
};

exports.getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};

exports.getDateDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};
