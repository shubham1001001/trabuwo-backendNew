const service = require("./service");
const { successResponse } = require("../../utils/responseHandler");
const asyncHandler = require("../../utils/asyncHandler");

exports.createCategory = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  const image = req.file;
  
  const category = await service.createCategory(
    data, 
    image ? image.buffer : null, 
    image ? image.originalname : null, 
    image ? image.mimetype : null
  );
  
  return successResponse(res, "Mobile category created successfully", category, 201);
});

exports.getAllCategories = asyncHandler(async (req, res) => {
  const categories = await service.getAllCategories(req.query);
  return successResponse(res, "Mobile categories fetched successfully", categories);
});

exports.getCategory = asyncHandler(async (req, res) => {
  const category = await service.getCategoryByPublicId(req.params.publicId);
  return successResponse(res, "Mobile category fetched successfully", category);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  const image = req.file;
  
  const category = await service.updateCategoryByPublicId(
    req.params.publicId, 
    data, 
    image ? image.buffer : null, 
    image ? image.originalname : null, 
    image ? image.mimetype : null
  );
  
  return successResponse(res, "Mobile category updated successfully", category);
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  await service.deleteCategoryByPublicId(req.params.publicId);
  return successResponse(res, "Mobile category deleted successfully");
});
