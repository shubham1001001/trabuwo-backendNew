const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notifications = await service.getNotifications(userId);

  return apiResponse.success(
    res,
    notifications,
    "Stock notifications retrieved successfully"
  );
});

exports.subscribeToVariant = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productVariantPublicId } = req.body;

  const notification = await service.subscribeToVariant(
    userId,
    productVariantPublicId
  );
  return apiResponse.success(
    res,
    notification,
    "Subscribed to stock notification successfully",
    201
  );
});

exports.unsubscribeFromVariant = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { notificationPublicId } = req.params;

  const result = await service.unsubscribeFromVariant(userId, notificationPublicId);
  return apiResponse.success(
    res,
    result,
    "Unsubscribed from stock notification successfully"
  );
});
