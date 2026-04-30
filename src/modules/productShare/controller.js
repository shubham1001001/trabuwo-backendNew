const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.shareProduct = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  await service.shareProduct(userId, productId);
  return apiResponse.success(res, null, "Product shared successfully", 201);
};

exports.getSharedProducts = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const result = await service.getSharedProducts(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  return apiResponse.success(res, result, "Shared products retrieved successfully");
};
