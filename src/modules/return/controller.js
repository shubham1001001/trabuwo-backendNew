const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

exports.initiateReturn = asyncHandler(async (req, res) => {
  const { orderItemPublicId, reason } = req.body;
  const buyerId = req.user.id;

  const returnRecord = await service.initiateReturn(
    orderItemPublicId,
    buyerId,
    reason
  );

  return apiResponse.success(
    res,
    returnRecord,
    "Return initiated successfully",
    201
  );
});

exports.getMyReturns = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const returns = await service.listReturns(userId, "buyer");

  return apiResponse.success(res, returns, "Returns retrieved successfully");
});

exports.getReturnById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const returnRecord = await service.getReturnById(id, userId);

  return apiResponse.success(res, returnRecord, "Return retrieved successfully");
});

exports.processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user.id;

  const returnRecord = await service.processRefund(id, sellerId);

  return apiResponse.success(
    res,
    returnRecord,
    "Refund processed successfully"
  );
});

