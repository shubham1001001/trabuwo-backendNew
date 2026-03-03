const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

exports.createAsset = asyncHandler(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const mimeType = req.file ? req.file.mimetype : null;
  const imageName = req.file ? req.file.originalname : null;

  const created = await service.createAssetWithUpload(
    req.body,
    imageBuffer,
    mimeType,
    imageName
  );

  return apiResponse.success(res, created, "Section asset created", 201);
});

exports.updateAsset = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const imageBuffer = req.file ? req.file.buffer : null;
  const mimeType = req.file ? req.file.mimetype : null;
  const imageName = req.file ? req.file.originalname : null;

  const updated = await service.updateAssetWithUpload(
    publicId,
    req.body,
    imageBuffer,
    mimeType,
    imageName
  );

  return apiResponse.success(
    res,
    {
      publicId: updated.publicId,
      sectionId: updated.sectionId,
      redirectCategoryId: updated.redirectCategoryId,
      iconLargeUrl: updated.iconLargeUrl,
      originalImageUrl: updated.originalImageUrl,
      altText: updated.altText,
      deviceType: updated.deviceType,
      displayOrder: updated.displayOrder,
      enabled: updated.enabled,
      filters: updated.filters,
    },
    "Section asset updated"
  );
});

exports.deleteSection = asyncHandler(async (req, res) => {
  const { sectionPublicId } = req.params;

  await service.deleteSectionWithAssets(sectionPublicId);

  return apiResponse.success(
    res,
    { success: true },
    "Section deleted successfully"
  );
});

exports.deleteAsset = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  await service.deleteAssetByPublicId(publicId);

  return apiResponse.success(
    res,
    { success: true },
    "Section asset deleted successfully"
  );
});
