const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.create = async (req, res) => {
  const created = await service.createReview(req.body, req.user.id);
  return apiResponse.success(res, created, "Review created", 201);
};

exports.update = async (req, res) => {
  const updated = await service.updateReview(
    req.params.id,
    req.body,
    req.user.id
  );
  return apiResponse.success(res, updated, "Review updated");
};

exports.remove = async (req, res) => {
  await service.deleteReview(req.params.id, req.user.id);
  return apiResponse.success(res, null, "Review deleted");
};

exports.getProductReviews = async (req, res) => {
  const { page = 1, limit = 10, sort = "newest" } = req.query;
  const result = await service.getProductReviews(req.params.productId, {
    page: Number(page),
    limit: Number(limit),
    sort,
  });
  return apiResponse.success(res, result);
};

exports.getMyReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await service.getMyReviews(req.user.id, {
    page: Number(page),
    limit: Number(limit),
  });
  return apiResponse.success(res, result);
};

exports.generatePresignedUrl = async (req, res) => {
  const { fileName, contentType } = req.body;
  const presignedUrlData = await service.generatePresignedUrl(
    fileName,
    contentType,
    req.user.id
  );
  return apiResponse.success(
    res,
    presignedUrlData,
    "Presigned URL generated successfully"
  );
};

exports.markHelpful = async (req, res) => {
  await service.markHelpful(req.params.id, req.user.id);
  return apiResponse.success(res, null, "Marked helpful");
};

exports.unmarkHelpful = async (req, res) => {
  await service.unmarkHelpful(req.params.id, req.user.id);
  return apiResponse.success(res, null, "Unmarked helpful");
};

exports.getStoreReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await service.getStoreReviews(req.params.storeId, {
    page: Number(page),
    limit: Number(limit),
  });
  return apiResponse.success(res, result);
};

exports.getStoreRatingHistogram = async (req, res) => {
  const result = await service.getStoreRatingHistogram(req.params.storeId);
  return apiResponse.success(res, result);
};
