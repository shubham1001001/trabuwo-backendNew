const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

exports.createCategoryIcon = asyncHandler(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const mimeType = req.file ? req.file.mimetype : null;
  const imageName = req.file ? req.file.originalname : null;

  const created = await service.createCategoryIconWithUpload(
    req.body,
    imageBuffer,
    mimeType,
    imageName
  );

  return apiResponse.success(
    res,
    {
      publicId: created.publicId,
      categoryId: created.categoryId,
      iconUrl: created.iconUrl,
      altText: created.altText,
      enabled: created.enabled,
      filter: created.filter,
    },
    "Category icon created",
    201
  );
});

exports.updateCategoryIcon = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const imageBuffer = req.file ? req.file.buffer : null;
  const mimeType = req.file ? req.file.mimetype : null;
  const imageName = req.file ? req.file.originalname : null;

  const updated = await service.updateCategoryIconWithUpload(
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
      categoryId: updated.categoryId,
      iconUrl: updated.iconUrl,
      altText: updated.altText,
      enabled: updated.enabled,
      filter: updated.filter,
    },
    "Category icon updated"
  );
});

exports.deleteCategoryIcon = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  await service.deleteCategoryIconByPublicId(publicId);

  return apiResponse.success(
    res,
    { success: true },
    "Category icon deleted successfully"
  );
});

exports.getCategoryIconsByCategoryId = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const icons = await service.getCategoryIconsForCategoryId(categoryId);

  return apiResponse.success(
    res,
    icons,
    "Category icons fetched successfully"
  );
});


