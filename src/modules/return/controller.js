const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");
const { OrderCancelReason } = require("../order/cancelReasonModel");


exports.initiateReturn = asyncHandler(async (req, res) => {
  const { orderItemPublicId, reason, subreason } = req.body;
  const buyerId = req.user.id;

  const returnRecord = await service.initiateReturn(
    orderItemPublicId,
    buyerId,
    reason,
    subreason
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

exports.getReturnReasons = asyncHandler(async (req, res) => {
  const reasons = await OrderCancelReason.findAll({
    where: { userType: "buyer", isActive: true, type: "return" },
    attributes: ["reason", "description", "subreasons"],
    order: [["id", "ASC"]]
  });

  const formattedReasons = reasons.map(r => {
    const reasonObj = r.get({ plain: true });
    if (!reasonObj.description) delete reasonObj.description;
    if (!reasonObj.subreasons || reasonObj.subreasons.length === 0) delete reasonObj.subreasons;
    return reasonObj;
  });

  return apiResponse.success(res, formattedReasons);
});

