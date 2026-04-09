const {
  createCatalogue,
  getCatalogueById,
  getCatalogueByPublicId,
  getAllCatalogues,
  getCataloguesByUserId,
  updateCatalogueById,
  softDeleteCatalogueById,
  getCataloguesByStatus,
  getQcErrorCountStats,
  getCatalogueStatusCountsStats,
  getCatalogueIdsByUserId,
  getAllCataloguesWithKeysetPagination,
  getSellerStatsByUserId,
  searchMinimalCatalogues,
} = require("./dao");
const { getUserViewedCategorySlugs } = require("../productViewHistory/dao");
const {
  getCategoryById,
  getAllCategories,
  getAllCategoriesPlain,
} = require("../category/dao");
const { getAllLeafDescendants } = require("../category/helper");
const Category = require("../category/model");
const { Op } = require("sequelize");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  ResourceCreationError,
} = require("../../utils/errors");

exports.createCatalogue = async (data, userId, options = {}) => {
  let categoryId = data.categoryId;

  // Resolve publicId (UUID) to internal ID if necessary
  if (typeof categoryId === "string" && categoryId.length > 10) {
    const category = await getCategoryByPublicId(categoryId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    categoryId = category.id;
  }

  let thumbnailUrl = data.thumbnailUrl || null;

  // Auto-set thumbnailUrl if products and images are present
  if (!thumbnailUrl && data.products && data.products.length > 0) {
    const firstProduct = data.products[0];
    if (firstProduct.images && firstProduct.images.length > 0) {
      // Find primary image or just take the first one
      const primaryImage = firstProduct.images.find(img => img.isPrimary) || firstProduct.images[0];
      thumbnailUrl = primaryImage.imageUrl;
    }
  }

  // Calculate price ranges from variants
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let hasPrices = false;

  if (data.products) {
    data.products.forEach(prd => {
      if (prd.variants) {
        prd.variants.forEach(v => {
          const price = parseFloat(v.trabuwoPrice);
          if (!isNaN(price)) {
            if (price < minPrice) minPrice = price;
            if (price > maxPrice) maxPrice = price;
            hasPrices = true;
          }
        });
      }
    });
  }

  const catalogueData = {
    ...data,
    categoryId,
    userId,
    thumbnailUrl,
    minPrice: hasPrices ? minPrice : 0,
    maxPrice: hasPrices ? maxPrice : 0,
  };

  const catalogue = await createCatalogue(catalogueData, options);
  return catalogue;
};

exports.getCatalogueById = async (id) => {
  const catalogue = await getCatalogueById(id);
  if (!catalogue) {
    throw new NotFoundError("Catalogue not found");
  }
  return catalogue;
};

exports.getAllCatalogues = async (filters = {}) => {
  return await getAllCatalogues(filters);
};

exports.getCataloguesByUserId = async (userId, options = {}) => {
  const normalized = { ...options };
  if (typeof normalized.search === "string") {
    normalized.search = normalized.search.trim() || null;
  }
  normalized.wishlistUserId = userId;
  return await getCataloguesByUserId(userId, normalized);
};

exports.getCatalogueIdsByUserId = async (userId, options = {}) => {
  return await getCatalogueIdsByUserId(userId, options);
};

exports.updateCatalogueById = async (id, data, userId) => {
  const catalogue = await getCatalogueById(id);
  if (!catalogue) {
    throw new NotFoundError("Catalogue not found");
  }

  if (catalogue.userId !== userId) {
    throw new ConflictError("You can only update your own catalogues");
  }

  if (catalogue.status !== "draft") {
    throw new ConflictError("Only draft catalogues can be updated");
  }

  if (data.name !== undefined && (!data.name || data.name.trim() === "")) {
    throw new ValidationError("Catalogue name cannot be empty");
  }

  const updatedCatalogue = await updateCatalogueById(id, data);
  if (!updatedCatalogue) {
    throw new ResourceCreationError("Failed to update catalogue");
  }

  return updatedCatalogue;
};

exports.softDeleteCatalogueById = async (id, userId) => {
  const catalogue = await getCatalogueById(id);
  if (!catalogue) {
    throw new NotFoundError("Catalogue not found");
  }

  if (catalogue.userId !== userId) {
    throw new ConflictError("You can only delete your own catalogues");
  }

  if (catalogue.status !== "draft") {
    throw new ConflictError("Only draft catalogues can be deleted");
  }

  const deleted = await softDeleteCatalogueById(id);

  if (!deleted) {
    throw new ResourceCreationError("Failed to delete catalogue");
  }

  return true;
};

exports.submitCatalogueForQC = async (id, userId) => {
  if (!id || isNaN(parseInt(id))) {
    throw new ValidationError("Valid catalogue ID is required");
  }

  if (!userId || isNaN(parseInt(userId))) {
    throw new ValidationError("Valid user ID is required");
  }

  const catalogue = await getCatalogueById(id);
  if (!catalogue) {
    throw new NotFoundError("Catalogue not found");
  }

  if (catalogue.userId !== userId) {
    throw new ConflictError("You can only submit your own catalogues");
  }

  if (catalogue.status !== "draft") {
    throw new ConflictError("Only draft catalogues can be submitted for QC");
  }

  const updateData = {
    status: "qc_in_progress",
    submittedAt: new Date(),
  };

  const updatedCatalogue = await updateCatalogueById(id, updateData);
  if (!updatedCatalogue) {
    throw new ResourceCreationError("Failed to submit catalogue for QC");
  }

  return updatedCatalogue;
};

exports.updateQCStatus = async (publicId, status, qcNotes = null) => {
  const catalogue = await getCatalogueByPublicId(publicId);
  if (!catalogue) {
    throw new NotFoundError("Catalogue not found");
  }

  if (catalogue.status !== "qc_in_progress") {
    throw new ConflictError(
      "Only catalogues in QC progress can have their status updated",
    );
  }

  // Automaticaly transition qc_passed to live for buyer visibility
  let finalStatus = status;
  if (status === "qc_passed") {
    finalStatus = "live";
  }

  const updateData = {
    status: finalStatus,
    qcNotes,
    qcReviewedAt: new Date(),
  };

  const updatedCatalogue = await updateCatalogueById(catalogue.id, updateData);
  if (!updatedCatalogue) {
    throw new ResourceCreationError("Failed to update QC status");
  }

  return updatedCatalogue;
};

exports.getCataloguesByStatus = async (status, options = {}) => {
  return await getCataloguesByStatus(status, options);
};

exports.getQcErrorCountData = async () => {
  return await getQcErrorCountStats();
};

exports.getCatalogueStatusCountsData = async () => {
  return await getCatalogueStatusCountsStats();
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n | 0));
const normalizeArray = (v) =>
  Array.isArray(v) ? v.filter(Boolean) : v != null ? [v].filter(Boolean) : [];

exports.getAllCataloguesWithKeysetPagination = async (options) => {
  const {
    cursor,
    sortBy,
    limit = 20,
    search,
    personalize = false,
    userId = null,
    categoryId,
    ...filters
  } = options;

  // Remove categoryId from filters if it exists there (shouldn't, but just in case)
  delete filters.categoryId;

  const normalizedLimit = clamp(parseInt(limit, 10), 1, 100);
  const normalizedSearch =
    typeof search === "string" ? search.trim() || null : null;

  const normalizedFilters = { ...filters };

  if (normalizedFilters.rating) {
    const ratingValues = normalizeArray(normalizedFilters.rating).map((v) =>
      parseFloat(v),
    );
    normalizedFilters.rating = Math.min(...ratingValues);
  }

  if (normalizedFilters.discount) {
    const discountValues = normalizeArray(normalizedFilters.discount).map((v) =>
      parseFloat(v),
    );
    normalizedFilters.discount = Math.min(...discountValues);
  }

  // Handle 'category' string filter (name or slug) from buyer frontend
  let resolvedCategoryId = categoryId;
  const categoryFilter = normalizedFilters.category;
  delete normalizedFilters.category;

  if (!resolvedCategoryId && categoryFilter) {
    const { findCategoryBySlugOrName } = require("../category/dao");
    const foundCategory = await findCategoryBySlugOrName(categoryFilter);
    if (foundCategory) {
      resolvedCategoryId = foundCategory.id;
    }
  }

  let categoryIds = null;

  if (resolvedCategoryId) {
    const parsedCategoryId = parseInt(resolvedCategoryId, 10);
    if (isNaN(parsedCategoryId)) {
      throw new ValidationError("Category ID must be a valid integer");
    }

    const category = await getCategoryById(parsedCategoryId);
    if (!category || category.isDeleted) {
      throw new NotFoundError("Category not found");
    }

    const categoriesPlain = await getAllCategoriesPlain({ isDeleted: false });

    // Build children map to check if category has children
    const childrenMap = new Map();
    categoriesPlain.forEach((cat) => {
      if (cat.parentId != null && cat.parentId !== 0) {
        if (!childrenMap.has(cat.parentId)) {
          childrenMap.set(cat.parentId, []);
        }
        childrenMap.get(cat.parentId).push(cat);
      }
    });

    // Identify categories that have children
    const categoriesWithChildren = new Set();
    categoriesPlain.forEach((cat) => {
      if (childrenMap.has(cat.id)) {
        categoriesWithChildren.add(cat.id);
      }
    });

    // Check if category is a leaf (has no children)
    const isLeaf = !categoriesWithChildren.has(parsedCategoryId);

    if (isLeaf) {
      // If it's a leaf category, use just this categoryId
      categoryIds = [parsedCategoryId];
    } else {
      // If it's not a leaf, get all leaf descendant category IDs
      const leafDescendants = getAllLeafDescendants(
        categoriesPlain,
        parsedCategoryId,
      );
      categoryIds = leafDescendants.map((cat) => cat.id);

      if (!categoryIds || categoryIds.length === 0) {
        categoryIds = [parsedCategoryId];
      }
    }
  } else if (!normalizedSearch && personalize && userId) {
    // Handle personalize feature: convert slugs to categoryIds
    const slugs = await getUserViewedCategorySlugs(userId, { limit: 5 });
    if (slugs.length > 0) {
      // Fetch categories by slugs
      const categories = await Category.findAll({
        where: {
          slug: { [Op.in]: slugs },
          isDeleted: false,
        },
      });

      if (categories.length > 0) {
        // Get all categories to build tree structure
        const allCategories = await getAllCategories({ isDeleted: false });

        // Convert to plain objects to ensure consistent property access
        const categoriesPlain = allCategories.map((cat) => ({
          id: cat.id,
          parentId: cat.parentId,
        }));

        // Build children map
        const childrenMap = new Map();
        categoriesPlain.forEach((cat) => {
          if (cat.parentId != null && cat.parentId !== 0) {
            if (!childrenMap.has(cat.parentId)) {
              childrenMap.set(cat.parentId, []);
            }
            childrenMap.get(cat.parentId).push(cat);
          }
        });

        // Identify categories that have children
        const categoriesWithChildren = new Set();
        categoriesPlain.forEach((cat) => {
          if (childrenMap.has(cat.id)) {
            categoriesWithChildren.add(cat.id);
          }
        });

        // For each category, get leaf descendants or use the category itself if it's a leaf
        const allLeafCategoryIds = new Set();
        categories.forEach((category) => {
          const categoryId = category.id;
          const isLeaf = !categoriesWithChildren.has(categoryId);
          if (isLeaf) {
            allLeafCategoryIds.add(categoryId);
          } else {
            const leafDescendants = getAllLeafDescendants(
              categoriesPlain,
              categoryId,
            );
            leafDescendants.forEach((leaf) => allLeafCategoryIds.add(leaf.id));
          }
        });

        categoryIds = Array.from(allLeafCategoryIds);
      }
    }
  }

  // Add categoryIds to filters if we have any
  if (categoryIds && categoryIds.length > 0) {
    normalizedFilters.categoryIds = categoryIds;
  }

  const result = await getAllCataloguesWithKeysetPagination({
    cursor,
    sortBy,
    limit: normalizedLimit,
    search: normalizedSearch,
    filters: normalizedFilters,
    userId,
  });

  return result;
};

exports.searchMinimalCatalogues = async (options = {}) => {
  const { search } = options;

  const normalizedSearch =
    typeof search === "string" ? search.trim() || null : null;

  if (!normalizedSearch) {
    return [];
  }

  const limit = 10;

  return await searchMinimalCatalogues({
    search: normalizedSearch,
    limit,
  });
};

exports.getMyCatalogues = async (userId, options = {}) => {
  return await getCataloguesByUserId(userId, options);
};

exports.getSellerStatsByUserId = async (userId) => {
  return await getSellerStatsByUserId(userId);
};
