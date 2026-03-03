const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const sanitizePayload = (payload) => {
  const sanitized = { ...payload };

  // Convert empty strings to null, parse integers, leave undefined as undefined
  if (sanitized.parentId !== undefined) {
    sanitized.parentId =
      sanitized.parentId === "" ? null : parseInt(sanitized.parentId, 10);
  }

  if (sanitized.sectionId !== undefined) {
    sanitized.sectionId =
      sanitized.sectionId === "" ? null : parseInt(sanitized.sectionId, 10);
  }

  if (sanitized.redirectCategoryId !== undefined) {
    sanitized.redirectCategoryId =
      sanitized.redirectCategoryId === ""
        ? null
        : parseInt(sanitized.redirectCategoryId, 10);
  }

  if (sanitized.displayOrder !== undefined) {
    sanitized.displayOrder =
      sanitized.displayOrder === ""
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

const formatHomeCategoryResponse = (homeCategory) => {
  if (!homeCategory) return null;

  const data = homeCategory.toJSON ? homeCategory.toJSON() : homeCategory;

  return {
    publicId: data.publicId,
    name: data.name,
    parentId: data.parentId,
    sectionId: data.sectionId,
    redirectCategoryId: data.redirectCategoryId,
    imgUrl: data.imgUrl,
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
  const tree = await service.getHomeCategoryTree();
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
  const homeCategories = await service.getHomeCategoriesForHomePage();
  const formatted = homeCategories.map((hc) => formatHomeCategoryResponse(hc));
  return apiResponse.success(
    res,
    formatted,
    "Home categories retrieved successfully"
  );
});
