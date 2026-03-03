const callbackService = require("./service");
const apiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

exports.createCallback = asyncHandler(async (req, res) => {
  const callback = await callbackService.createCallback(req.body, req.user.id);
  return apiResponse.success(
    res,
    callback,
    "Callback created successfully",
    201
  );
});

exports.updateCallbackStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const callback = await callbackService.updateCallbackStatus(id, status);
  return apiResponse.success(
    res,
    callback,
    "Callback status updated successfully"
  );
});

exports.deleteCallback = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await callbackService.deleteCallback(id);
  return apiResponse.success(res, result, "Callback deleted successfully");
});

exports.getAllCallbacks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await callbackService.getAllCallbacks(page, limit);
  return apiResponse.success(res, result, "Callbacks retrieved successfully");
});

exports.getCallbackById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const callback = await callbackService.getCallbackById(id);
  return apiResponse.success(res, callback, "Callback retrieved successfully");
});
