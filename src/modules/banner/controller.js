const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const { ValidationError } = require("../../utils/errors");
const asyncHandler = require("../../utils/asyncHandler");

exports.createBanner = asyncHandler(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const originalMimeType = req.file ? req.file.mimetype : null;

  if (!imageBuffer) {
    return new ValidationError("Banner image is required");
  }

  const banner = await service.createBanner(
    req.body,
    imageBuffer,
    originalMimeType
  );
  return apiResponse.success(res, banner, "Banner created successfully", 201);
});

exports.getBannerById = asyncHandler(async (req, res) => {
  const banner = await service.getBannerById(req.params.id);
  return apiResponse.success(res, banner, "Banner retrieved successfully");
});

exports.getAllBanners = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.query.section) {
    filters.section = req.query.section;
  }

  if (req.query.isActive !== undefined) {
    filters.isActive = req.query.isActive === "true";
  }

  if (req.query.currentTime === "true") {
    filters.currentTime = new Date();
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (req.query.page) {
    const result = await service.getBannersWithPagination(page, limit, filters);
    return apiResponse.success(
      res,
      {
        banners: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.count / limit),
          totalItems: result.count,
          itemsPerPage: limit,
        },
      },
      "Banners retrieved successfully"
    );
  }

  const banners = await service.getAllBanners(filters);
  return apiResponse.success(res, banners, "Banners retrieved successfully");
});

exports.getBannersBySection = asyncHandler(async (req, res) => {
  const banners = await service.getBannersBySection(req.params.section);
  return apiResponse.success(res, banners, "Banners retrieved successfully");
});

exports.updateBanner = asyncHandler(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const originalMimeType = req.file ? req.file.mimetype : null;

  const updatedBanner = await service.updateBannerById(
    req.params.id,
    req.body,
    imageBuffer,
    originalMimeType
  );
  return apiResponse.success(res, updatedBanner, "Banner updated successfully");
});

exports.softDeleteBanner = asyncHandler(async (req, res) => {
  await service.softDeleteBannerById(req.params.id);
  return apiResponse.success(res, null, "Banner deleted successfully");
});

exports.activateDeactivateBanner = asyncHandler(async (req, res) => {
  const updatedBanner = await service.activateDeactivateBanner(
    req.params.id,
    req.body.isActive
  );
  const action = req.body.isActive ? "activated" : "deactivated";
  return apiResponse.success(
    res,
    updatedBanner,
    `Banner ${action} successfully`
  );
});

exports.getBannerCount = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.query.section) {
    filters.section = req.query.section;
  }

  if (req.query.isActive !== undefined) {
    filters.isActive = req.query.isActive === "true";
  }

  const count = await service.getBannerCount(filters);
  return apiResponse.success(
    res,
    { count },
    "Banner count retrieved successfully"
  );
});

exports.getActiveBannersCount = asyncHandler(async (req, res) => {
  const count = await service.getActiveBannersCount();
  return apiResponse.success(
    res,
    { count },
    "Active banners count retrieved successfully"
  );
});

exports.bulkUpdateBanners = asyncHandler(async (req, res) => {
  const results = await service.bulkUpdateBanners(req.body.updates);
  return apiResponse.success(res, results, "Banners updated successfully");
});
