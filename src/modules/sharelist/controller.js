const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

exports.getSharelist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const list = await service.getSharelist(userId);
  return apiResponse.success(res, list, "Sharelist retrieved successfully");
});

exports.addToSharelist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { catalogueId } = req.body;
  const list = await service.addToSharelist(userId, catalogueId);
  return apiResponse.success(res, list, "Catalogue added to sharelist successfully");
});


