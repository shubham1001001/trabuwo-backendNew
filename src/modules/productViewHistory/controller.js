const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.trackProductView = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  await service.trackProductView(userId, productId);
  return apiResponse.success(res, null, "Product view tracked successfully", 201);
};

exports.getUserViewHistory = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const result = await service.getUserViewHistory(userId, pagination);
  return apiResponse.success(res, result, "View history retrieved successfully");
};

