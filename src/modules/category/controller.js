const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const { ValidationError, NotFoundError } = require("../../utils/errors");

exports.createCategory = async (req, res) => {
  const category = await service.createCategory(req.body);
  return apiResponse.success(
    res,
    category,
    "Category created successfully",
    201
  );
};

exports.getCategoryById = async (req, res) => {
  const category = await service.getCategoryById(req.params.id);
  return apiResponse.success(res, category, "Category retrieved successfully");
};

exports.getAllCategories = async (req, res) => {
  const filters = {};

  if (req.query.isVisible !== undefined) {
    filters.isVisible = req.query.isVisible === "true";
  }

  if (req.query.isDeleted !== undefined) {
    filters.isDeleted = req.query.isDeleted === "true";
  }

  const categories = await service.getAllCategories(filters);
  return apiResponse.success(
    res,
    categories,
    "Categories retrieved successfully"
  );
};

exports.updateCategory = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ValidationError("Invalid category ID");
  }
  const updatedCategory = await service.updateCategoryById(id, req.body);
  return apiResponse.success(
    res,
    updatedCategory,
    "Category updated successfully"
  );
};

exports.hideUnhideCategory = async (req, res) => {
  const updatedCategory = await service.hideUnhideCategory(
    req.params.id,
    req.body.isVisible
  );
  const action = req.body.isVisible ? "shown" : "hidden";
  return apiResponse.success(
    res,
    updatedCategory,
    `Category ${action} successfully`
  );
};

exports.softDeleteCategory = async (req, res) => {
  await service.softDeleteCategoryById(req.params.id);
  return apiResponse.success(res, null, "Category deleted successfully");
};

exports.getCategoriesByParentId = async (req, res) => {
  const parentId = parseInt(req.params.parentId);
  if (isNaN(parentId)) {
    throw new ValidationError("Invalid parentId parameter");
  }

  const categories = await service.getCategoriesByParentId(parentId);
  return apiResponse.success(
    res,
    categories,
    "Child categories retrieved successfully"
  );
};

exports.getCategoryTree = async (req, res) => {
  const tree = await service.getCategoryTree();
  return apiResponse.success(res, tree, "Category tree retrieved successfully");
};

// Additional enhanced controller methods
exports.getCategoryWithChildren = async (req, res) => {
  const category = await service.getCategoryWithChildren(req.params.id);
  return apiResponse.success(
    res,
    category,
    "Category with children retrieved successfully"
  );
};

exports.getCategoryWithParent = async (req, res) => {
  const category = await service.getCategoryWithParent(req.params.id);
  return apiResponse.success(
    res,
    category,
    "Category with parent retrieved successfully"
  );
};

exports.getCategoryAncestors = async (req, res) => {
  const ancestors = await service.getCategoryAncestors(req.params.id);
  return apiResponse.success(
    res,
    ancestors,
    "Category ancestors retrieved successfully"
  );
};

exports.getCategoryDepth = async (req, res) => {
  const depth = await service.getCategoryDepth(req.params.id);
  return apiResponse.success(
    res,
    { depth },
    "Category depth retrieved successfully"
  );
};

exports.bulkUpdateCategories = async (req, res) => {
  const results = await service.bulkUpdateCategories(req.body.updates);
  return apiResponse.success(res, results, "Categories updated successfully");
};

exports.searchCategoriesWithChain = async (req, res) => {
  const { searchTerm } = req.query;
  const filters = { isVisible: true, isDeleted: false };
  const result = await service.searchCategoriesWithChain(searchTerm, filters);
  return apiResponse.success(
    res,
    result,
    "Categories with chain search completed successfully"
  );
};

exports.lastUsedCategoryWithChain = async (req, res) => {
  const userId = req.user.id;
  const result = await service.getLastUsedCategoryWithChain(userId);
  if (!result) {
    throw new NotFoundError("No last used category found for user");
  }
  return apiResponse.success(
    res,
    result,
    "Last used category with chain fetched successfully"
  );
};

exports.getLeafCategories = async (req, res) => {
  const leafCategories = await service.getLeafCategoriesForMobile();
  return apiResponse.success(
    res,
    leafCategories,
    "Leaf categories retrieved successfully"
  );
};

exports.getCategoryChildrenOrSiblings = async (req, res) => {
  const categoryId = parseInt(req.params.categoryId);
  if (isNaN(categoryId)) {
    throw new ValidationError("Invalid categoryId parameter");
  }

  const categories = await service.getCategoryChildrenOrSiblings(categoryId);
  return apiResponse.success(
    res,
    categories,
    "Category children or siblings retrieved successfully"
  );
};

exports.searchCategoryFilters = async (req, res) => {
  const { searchTerm } = req.query;
  const result = await service.searchCategoryFilters(searchTerm);
  return apiResponse.success(
    res,
    result,
    "Category filters retrieved successfully"
  );
};
