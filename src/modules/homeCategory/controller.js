const service = require("./service");
const categoryService = require("../category/service");
const apiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const sanitizePayload = (payload) => {
  const sanitized = { ...payload };

  // Convert empty strings to null, parse integers, leave undefined as undefined
  if (sanitized.parentId !== undefined) {
    sanitized.parentId =
      sanitized.parentId === "" || sanitized.parentId === null ? null : parseInt(sanitized.parentId, 10);
  }

  if (sanitized.sectionId !== undefined) {
    sanitized.sectionId =
      sanitized.sectionId === "" || sanitized.sectionId === null ? null : parseInt(sanitized.sectionId, 10);
  }

  if (sanitized.redirectCategoryId !== undefined) {
    sanitized.redirectCategoryId =
      sanitized.redirectCategoryId === "" || sanitized.redirectCategoryId === null
        ? null
        : parseInt(sanitized.redirectCategoryId, 10);
  }

  if (sanitized.displayOrder !== undefined) {
    sanitized.displayOrder =
      sanitized.displayOrder === "" || sanitized.displayOrder === null
        ? null
        : parseInt(sanitized.displayOrder, 10);
  }

  // Parse filters if it's a string
  if (
    sanitized.filters !== undefined &&
    typeof sanitized.filters === "string"
  ) {
    try {
      sanitized.filters = sanitized.filters
        ? JSON.parse(sanitized.filters)
        : {};
    } catch {
      sanitized.filters = {};
    }
  }

  // Convert boolean strings to booleans
  if (sanitized.isActive !== undefined) {
    sanitized.isActive =
      sanitized.isActive === "true" || sanitized.isActive === true;
  }

  if (sanitized.showOnHomePage !== undefined) {
    sanitized.showOnHomePage =
      sanitized.showOnHomePage === "true" || sanitized.showOnHomePage === true;
  }

  return sanitized;
};

const formatCategoryResponse = (category) => {
  if (!category) return null;

  const data = category.toJSON ? category.toJSON() : category;

  const formatted = {
    ...data,
    imageUrl: data.imageUrl
      ? data.imageUrl.startsWith("http")
        ? data.imageUrl
        : `https://${data.imageUrl}`
      : null,
  };

  if (data.children && Array.isArray(data.children)) {
    formatted.children = data.children.map(formatCategoryResponse);
  }

  return formatted;
};

const formatHomeCategoryResponse = (homeCategory) => {
  if (!homeCategory) return null;

  const data = homeCategory.toJSON ? homeCategory.toJSON() : homeCategory;

  return {
    id: data.id,
    publicId: data.publicId,
    name: data.name,
    parentId: data.parentId,
    sectionId: data.sectionId,
    redirectCategoryId: data.redirectCategoryId,
    imgUrl: data.imgUrl
      ? data.imgUrl.startsWith("http")
        ? data.imgUrl
        : `https://${data.imgUrl}`
      : null,
    displayOrder: data.displayOrder,
    isActive: data.isActive,
    deviceType: data.deviceType,
    filters: data.filters,
    showOnHomePage: data.showOnHomePage,
    parent: data.parent ? formatHomeCategoryResponse(data.parent) : null,
    redirectCategory: data.redirectCategory
      ? {
        id: data.redirectCategory.id,
        publicId: data.redirectCategory.publicId,
        name: data.redirectCategory.name,
        slug: data.redirectCategory.slug,
      }
      : null,
    children: data.children
      ? Array.isArray(data.children)
        ? data.children.map((child) => formatHomeCategoryResponse(child))
        : data.children
      : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

exports.createHomeCategory = asyncHandler(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const mimeType = req.file ? req.file.mimetype : null;
  const imageName = req.file ? req.file.originalname : null;
  const sanitizedPayload = sanitizePayload(req.body);
  const homeCategory = await service.createHomeCategory(
    sanitizedPayload,
    imageBuffer,
    mimeType,
    imageName
  );
  return apiResponse.success(
    res,
    formatHomeCategoryResponse(homeCategory),
    "Home category created successfully",
    201
  );
});

exports.getAllHomeCategories = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.query.sectionId !== undefined) {
    filters.sectionId = parseInt(req.query.sectionId, 10);
  }

  if (req.query.parentId !== undefined) {
    filters.parentId = req.query.parentId
      ? parseInt(req.query.parentId, 10)
      : null;
  }

  if (req.query.isActive !== undefined) {
    filters.isActive = req.query.isActive === "true";
  }

  if (req.query.deviceType !== undefined) {
    filters.deviceType = req.query.deviceType;
  }

  const homeCategories = await service.getAllHomeCategories(filters);
  const formatted = homeCategories.map((hc) => formatHomeCategoryResponse(hc));
  return apiResponse.success(
    res,
    formatted,
    "Home categories retrieved successfully"
  );
});

exports.getHomeCategoryByPublicId = asyncHandler(async (req, res) => {
  const homeCategory = await service.getHomeCategoryByPublicId(req.params.publicId);
  return apiResponse.success(
    res,
    formatHomeCategoryResponse(homeCategory),
    "Home category retrieved successfully"
  );
});

exports.updateHomeCategory = asyncHandler(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const mimeType = req.file ? req.file.mimetype : null;
  const imageName = req.file ? req.file.originalname : null;
  const sanitizedPayload = sanitizePayload(req.body);
  const updatedHomeCategory = await service.updateHomeCategory(
    req.params.publicId,
    sanitizedPayload,
    imageBuffer,
    mimeType,
    imageName
  );
  return apiResponse.success(
    res,
    formatHomeCategoryResponse(updatedHomeCategory),
    "Home category updated successfully"
  );
});

exports.deleteHomeCategory = asyncHandler(async (req, res) => {
  await service.deleteHomeCategory(req.params.publicId);
  return apiResponse.success(res, null, "Home category deleted successfully");
});

exports.getHomeCategoryTree = asyncHandler(async (req, res) => {
  const deviceType = req.query.deviceType || null;
  const tree = await service.getHomeCategoryTree(deviceType);
  const formatTree = (nodes) => {
    if (!Array.isArray(nodes)) return [];
    return nodes.map((node) => {
      const nodeData = node.toJSON ? node.toJSON() : node;

      let childrenFormatted = undefined;
      if (nodeData.children && Array.isArray(nodeData.children)) {
        childrenFormatted = nodeData.children.map((sectionGroup) => ({
          sectionName: sectionGroup.sectionName,
          children: formatTree(sectionGroup.children || []),
        }));
      }

      const formatted = formatHomeCategoryResponse(node);
      if (childrenFormatted !== undefined) {
        formatted.children = childrenFormatted;
      }

      return formatted;
    });
  };
  return apiResponse.success(
    res,
    formatTree(tree),
    "Home category tree retrieved successfully"
  );
});

exports.getHomeCategoriesBySection = asyncHandler(async (req, res) => {
  const sectionId = parseInt(req.params.sectionId, 10);
  const deviceType = req.query.deviceType || null;
  const homeCategories = await service.getHomeCategoriesBySection(
    sectionId,
    deviceType
  );
  const formatted = homeCategories.map((hc) => formatHomeCategoryResponse(hc));
  return apiResponse.success(
    res,
    formatted,
    "Home categories retrieved successfully"
  );
});

exports.getHomeCategoriesForHomePage = asyncHandler(async (req, res) => {
  const deviceType = req.query.deviceType || null;
  const homeCategories = await service.getHomeCategoriesForHomePage(deviceType);
  const formatted = homeCategories.map((hc) => formatHomeCategoryResponse(hc));
  return apiResponse.success(
    res,
    formatted,
    "Home categories retrieved successfully"
  );
});

exports.getMobileHomePageData = asyncHandler(async (req, res) => {
  const categoryTree = await categoryService.getCategoryTree();
  const homeCategories = await service.getHomeCategoriesForHomePage("mobile");

  const formattedCategoryTree = categoryTree.map(formatCategoryResponse);
  const formattedHomeCategories = homeCategories.map(formatHomeCategoryResponse);

  const responseData = [
    formattedCategoryTree,
    formattedHomeCategories
  ];

  return apiResponse.success(
    res,
    responseData,
    "Mobile home page data retrieved successfully"
  );
});
