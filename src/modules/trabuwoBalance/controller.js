const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

exports.getBalanceSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const result = await service.getBalanceSummary(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  return apiResponse.success(res, result, "Trabuwo balance retrieved successfully");
});
