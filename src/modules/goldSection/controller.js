const service = require("./service");
const GoldCategory = require("./goldCategoryModel");
const apiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

exports.getGoldSectionData = asyncHandler(async (req, res) => {
  const settings = await service.getSettings();
  
  // Fetch the gold categories from the dedicated table
  const goldCategories = await GoldCategory.findAll({
    where: { isDeleted: false, isActive: true },
    order: [["displayOrder", "ASC"], ["name", "ASC"]]
  });

  return apiResponse.success(
    res,
    {
      settings,
      categories: goldCategories
    },
    "Gold section data retrieved successfully"
  );
});

exports.updateGoldSettings = asyncHandler(async (req, res) => {
  const bgFile = req.files && req.files.backgroundImage ? req.files.backgroundImage[0] : null;
  const heroFile = req.files && req.files.heroImage ? req.files.heroImage[0] : null;

  const updated = await service.updateSettings(
    req.body,
    {
      bgFile,
      heroFile
    }
  );

  return apiResponse.success(
    res,
    updated,
    "Gold section settings updated successfully"
  );
});

exports.getGoldSettings = asyncHandler(async (req, res) => {
  const settings = await service.getSettings();
  return apiResponse.success(res, settings, "Gold settings retrieved");
});

// --- NEW DEDICATED GOLD CATEGORY CRUD ---

exports.createGoldCategory = asyncHandler(async (req, res) => {
  const imageFile = req.file;
  const data = { ...req.body };
  
  // Handle image upload if provided
  if (imageFile) {
     const uploadResult = await service.uploadGoldCategoryImage(imageFile);
     data.imgUrl = uploadResult;
  }

  // Sanitize redirectCategoryId: "" or "null" should be null
  if (!data.redirectCategoryId || data.redirectCategoryId === "" || data.redirectCategoryId === "null") {
      data.redirectCategoryId = null;
  } else {
      data.redirectCategoryId = parseInt(data.redirectCategoryId);
  }

  const category = await GoldCategory.create(data);
  return apiResponse.success(res, category, "Gold category tile added", 201);
});

exports.updateGoldCategory = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const imageFile = req.file;
  const data = { ...req.body };

  const existing = await GoldCategory.findOne({ where: { publicId } });
  if (!existing) return apiResponse.error(res, "Category not found", 404);

  if (imageFile) {
    const uploadResult = await service.uploadGoldCategoryImage(imageFile);
    data.imgUrl = uploadResult;
  }

  // Sanitize redirectCategoryId
  if (data.redirectCategoryId === "" || data.redirectCategoryId === "null") {
      data.redirectCategoryId = null;
  } else if (data.redirectCategoryId) {
      data.redirectCategoryId = parseInt(data.redirectCategoryId);
  }

  await existing.update(data);
  return apiResponse.success(res, existing, "Gold category tile updated");
});

exports.deleteGoldCategory = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const existing = await GoldCategory.findOne({ where: { publicId } });
  if (!existing) return apiResponse.error(res, "Category not found", 404);

  await existing.update({ isDeleted: true });
  return apiResponse.success(res, null, "Gold category tile removed");
});

exports.getGoldCategories = asyncHandler(async (req, res) => {
    const list = await GoldCategory.findAll({ where: { isDeleted: false }, order: [['displayOrder', 'ASC']]});
    return apiResponse.success(res, list, "Gold categories list");
});
