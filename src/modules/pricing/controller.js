const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.updateProductPrices = async (req, res) => {
  const updatedProduct = await service.updateProductPrices(
    req.params.productId,
    req.body,
    req.user.id
  );
  return apiResponse.success(
    res,
    { product: updatedProduct },
    "Product prices updated successfully"
  );
};

exports.getPricingStats = async (req, res) => {
  const stats = await service.getPricingStats(req.user.id);
  return apiResponse.success(
    res,
    stats,
    "Pricing statistics retrieved successfully"
  );
};

exports.getViewLossStats = async (req, res) => {
  const stats = await service.getViewLossStats(req.user.id);
  return apiResponse.success(
    res,
    stats,
    "View loss statistics retrieved successfully"
  );
};

exports.incrementProductView = async (req, res) => {
  const { productId } = req.params;
  const newCount = await service.incrementProductView(productId);
  return apiResponse.success(
    res,
    { productId, newCount },
    "Product view incremented successfully"
  );
};
