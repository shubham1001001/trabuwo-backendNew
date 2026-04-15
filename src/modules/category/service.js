const dao = require("./dao");
const { ValidationError, NotFoundError } = require("../../utils/errors");
const { wouldCreateCycle } = require("../../utils/parentChildCycle");
const {
  getCategoryDepth,
  getCategoryAncestorsWithRoot,
  generateUniqueHierarchicalSlug,
} = require("./helper");
const catalogueDao = require("../catalogue/dao");
const categorySchemaService = require("../categorySchema/service");
const s3Service = require("../../services/s3");
const config = require("config");
const { v7: uuidv7 } = require("uuid");
const {
  convertToWebP,
  sanitizeFileName,
  DEFAULT_QUALITY,
} = require("../../utils/imageProcessor");
const logger = require("../../config/logger");

exports.rebuildAllBreadcrumbs = async () => {
  const allCategories = await dao.getAllCategories({ isDeleted: false });
  if (!Array.isArray(allCategories) || allCategories.length === 0) {
    return true;
  }

  const updates = allCategories.map((category) => {
    const { ancestors } = getCategoryAncestorsWithRoot(
      allCategories,
      category.id
    );
    const breadCrumb = [...ancestors.map((a) => a.name), category.name].join(
      " > "
    );
    return {
      id: category.id,
      publicId: category.publicId,
      name: category.name,
      slug: category.slug,
      breadCrumb,
    };
  });

  await dao.bulkUpsertCategoryBreadcrumbs(updates);
  return true;
};

exports.createCategory = async (
  data,
  imageBuffer = null,
  mimeType = null,
  imageName = null
) => {
  const existing = await dao.getAllCategories({
    name: data.name,
    parentId: data.parentId || null,
    isDeleted: false,
  });

  if (existing.length > 0) {
    throw new ValidationError("Category name already exists under this parent");
  }

  // Remove displayOrderWeb if it's a subcategory (set to null)
  if (data.parentId && data.parentId !== 0) {
    data.displayOrderWeb = null;
  }

  if (data.displayOrderWeb !== undefined && data.displayOrderWeb !== null && parseInt(data.displayOrderWeb, 10) > 0) {
    const orderConflict = await dao.getAllCategories({
      displayOrderWeb: parseInt(data.displayOrderWeb, 10),
      parentId: data.parentId || null,
      isDeleted: false,
    });
    if (orderConflict.length > 0) {
      throw new ValidationError(
        `Display order ${data.displayOrderWeb} is already taken by '${orderConflict[0].name}'`
      );
    }
  }

  if (data.parentId) {
    const parent = await dao.getCategoryById(data.parentId);
    if (!parent || parent.isDeleted) {
      throw new ValidationError("Parent category does not exist");
    }
  }

  const created = await dao.createCategory(data);

  if (imageBuffer && mimeType) {
    try {
      const webpBuffer = await convertToWebP(
        imageBuffer,
        DEFAULT_QUALITY,
        mimeType,
        256,
        256
      );
      const sanitizedName = sanitizeFileName(imageName);
      const key = `category-images/${created.id}/${sanitizedName}-${uuidv7()}.webp`;
      await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
      const imageUrl = `${config.get("aws.cloudfront.domain")}/${key}`;
      await dao.updateCategoryById(created.id, { imageUrl });
    } catch (err) {
      logger.error("Failed to upload category image during creation", {
        categoryId: created.id,
        error: err,
      });
    }
  }

  // Regenerate slug after creation to ensure it's hierarchical
  // This includes the newly created category in allCategories for proper hierarchical slug generation
  const allCategories = await dao.getAllCategories({ isDeleted: false });
  const hierarchicalSlug = generateUniqueHierarchicalSlug(
    allCategories,
    created.id,
    created.name,
    created.parentId,
    null
  );

  const { ancestors, topmostParentId } = getCategoryAncestorsWithRoot(
    allCategories,
    created.id
  );

  const breadcrumb = [
    ...ancestors.map((a) => ({ id: a.id, name: a.name })),
    { id: created.id, name: created.name },
  ];
  const breadCrumb = breadcrumb.map((b) => b.name).join(" > ");

  const updateData = { breadCrumb, slug: hierarchicalSlug };
  await dao.updateCategoryById(created.id, updateData);

  const fresh = await dao.getCategoryById(created.id);
  return {
    ...fresh.toJSON(),
    breadcrumb,
    topMostParent: topmostParentId || created.id,
  };
};

exports.getCategoryById = async (id) => {
  const category = await dao.getCategoryById(id);
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  return category;
};

exports.getAllCategories = async (filters = {}) => {
  return await dao.getAllCategories(filters);
};

exports.updateCategoryById = async (
  id,
  data,
  imageBuffer = null,
  mimeType = null,
  imageName = null
) => {
  const category = await dao.getCategoryById(id);
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }

  if (data.name) {
    const existing = await dao.getAllCategories({
      name: data.name,
      parentId: category.parentId || null,
      isDeleted: false,
    });

    if (existing.length > 0 && existing[0].id !== parseInt(id)) {
      throw new ValidationError(
        "Category name already exists under this parent"
      );
    }
  }

  if (data.parentId !== undefined) {
    if (data.parentId === parseInt(id)) {
      throw new ValidationError("Category cannot be its own parent");
    }

    if (data.parentId) {
      const parent = await dao.getCategoryById(data.parentId);
      if (!parent || parent.isDeleted) {
        throw new ValidationError("Parent category does not exist");
      }

      const allCategories = await dao.getAllCategoriesPlain({
        isDeleted: false,
      });
      if (wouldCreateCycle(allCategories, parseInt(id), data.parentId)) {
        throw new ValidationError(
          "Setting this parent would create a circular dependency in the category hierarchy."
        );
      }
    }
  }

  // Remove displayOrderWeb if it's a subcategory (set to null)
  const currentParentId = data.parentId !== undefined ? data.parentId : category.parentId;
  if (currentParentId && currentParentId !== 0) {
    data.displayOrderWeb = null;
  }

  if (data.displayOrderWeb !== undefined && data.displayOrderWeb !== null && parseInt(data.displayOrderWeb, 10) > 0) {
    const orderConflict = await dao.getAllCategories({
      displayOrderWeb: parseInt(data.displayOrderWeb, 10),
      parentId: currentParentId || null,
      isDeleted: false,
    });
    if (orderConflict.length > 0 && orderConflict[0].id !== parseInt(id)) {
      throw new ValidationError(
        `Display order ${data.displayOrderWeb} is already taken by '${orderConflict[0].name}'`
      );
    }
  }

  const dataToUpdate = {};
  if (data.name) {
    dataToUpdate.name = data.name;
  }
  if (data.parentId !== undefined) {
    dataToUpdate.parentId = data.parentId;
  }
  if (data.isVisible !== undefined) {
    dataToUpdate.isVisible =
      data.isVisible === "true" || data.isVisible === true;
  }
  if (data.showOnWeb !== undefined) {
    dataToUpdate.showOnWeb =
      data.showOnWeb === "true" || data.showOnWeb === true;
  }
  if (data.isGold !== undefined) {
    dataToUpdate.isGold = data.isGold === "true" || data.isGold === true;
  }
  if (data.displayOrderWeb !== undefined) {
    const parsed = parseInt(data.displayOrderWeb, 10);
    dataToUpdate.displayOrderWeb = !isNaN(parsed) && parsed !== 0 ? parsed : null;
  }

  if (imageBuffer && mimeType) {
    try {
      const webpBuffer = await convertToWebP(
        imageBuffer,
        DEFAULT_QUALITY,
        mimeType,
        256,
        256
      );
      const sanitizedName = sanitizeFileName(imageName);
      const key = `category-images/${id}/${sanitizedName}-${uuidv7()}.webp`;
      await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
      dataToUpdate.imageUrl = `${config.get("aws.cloudfront.domain")}/${key}`;

      // Delete old image if exists
      if (category.imageUrl) {
        const oldKey = category.imageUrl.replace(
          `${config.get("aws.cloudfront.domain")}/`,
          ""
        );
        try {
          await s3Service.deleteObject(oldKey);
        } catch (s3err) {
          logger.warn("Failed to delete old category image from S3", {
            oldKey,
            error: s3err,
          });
        }
      }
    } catch (err) {
      logger.error("Failed to upload category image during update", {
        categoryId: id,
        error: err,
      });
    }
  }

  const needsSlugRegeneration =
    dataToUpdate.name || dataToUpdate.parentId !== undefined;

  // Only update if there's something to update
  if (Object.keys(dataToUpdate).length > 0) {
    const result = await dao.updateCategoryById(id, dataToUpdate);
    if (result[0] === 0) {
      throw new NotFoundError("Category not found");
    }
  }

  if (needsSlugRegeneration) {
    // Regenerate slugs for the category and all its descendants
    // This must happen after the update so children use the updated parent name/parentId
    await dao.regenerateSlugForCategoryAndDescendants(id);
    await exports.rebuildAllBreadcrumbs();
  }

  return await dao.getCategoryById(id);
};

exports.hideUnhideCategory = async (id, isVisible) => {
  const category = await dao.getCategoryById(id);
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }

  const result = await dao.updateCategoryById(id, { isVisible });
  if (result[0] === 0) {
    throw new NotFoundError("Category not found");
  }

  return await dao.getCategoryById(id);
};

exports.softDeleteCategoryById = async (id) => {
  const category = await dao.getCategoryById(id);
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }

  const result = await dao.softDeleteCategoryById(id);
  if (result[0] === 0) {
    throw new NotFoundError("Category not found");
  }

  return true;
};

exports.getCategoriesByParentId = async (parentId) => {
  return await dao.getCategoriesByParentId(parentId);
};

exports.getCategoryTree = async () => {
  return await dao.getCategoryTree();
};

exports.getMobileHomeCategoryTree = async () => {
  const tree = await dao.getCategoryTree();
  if (!Array.isArray(tree) || tree.length === 0) {
    return [];
  }

  const trendingIndex = tree.findIndex(
    (node) => String(node?.name || "").toLowerCase() === "trending",
  );

  const sourceNodesForAll =
    trendingIndex >= 0
      ? tree.filter((_, index) => index !== trendingIndex)
      : tree;

  const allChildren = [];
  sourceNodesForAll.forEach((node) => {
    if (Array.isArray(node?.children) && node.children.length > 0) {
      allChildren.push(...node.children);
    }
  });

  if (trendingIndex >= 0) {
    const trendingNode = tree[trendingIndex];
    const allNode = {
      ...trendingNode,
      name: "All",
      slug: "all",
      children: allChildren,
    };

    return [allNode, ...tree.filter((_, index) => index !== trendingIndex)];
  }

  return [
    {
      name: "All",
      slug: "all",
      parentId: null,
      children: allChildren,
    },
    ...tree,
  ];
};

// Additional enhanced methods
exports.getCategoryWithChildren = async (id) => {
  const category = await dao.getCategoryWithChildren(id);
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  return category;
};

exports.getCategoryWithParent = async (id) => {
  const category = await dao.getCategoryWithParent(id);
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  return category;
};

exports.getCategoryAncestors = async (id) => {
  const category = await dao.getCategoryById(id);
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  const allCategories = await dao.getAllCategories({ isDeleted: false });
  return getCategoryAncestorsWithRoot(allCategories, id);
};

exports.getCategoryDepth = async (id) => {
  const category = await dao.getCategoryById(id);
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  const allCategories = await dao.getAllCategories({ isDeleted: false });
  return getCategoryDepth(allCategories, id);
};

exports.bulkUpdateCategories = async (updates) => {
  // Validate all updates first
  for (const update of updates) {
    if (!update.id || !update.data) {
      throw new ValidationError("Each update must have id and data properties");
    }

    // Check if category exists
    const category = await dao.getCategoryById(update.id);
    if (!category || category.isDeleted) {
      throw new NotFoundError(`Category with ID ${update.id} not found`);
    }
  }

  return await dao.bulkUpdateCategories(updates);
};

exports.searchCategories = async (searchTerm, filters = {}) => {
  const allCategories = await dao.getAllCategories(filters);

  if (!searchTerm) {
    return allCategories;
  }

  const searchLower = searchTerm.toLowerCase();
  return allCategories.filter((category) =>
    category.name.toLowerCase().includes(searchLower)
  );
};

exports.searchCategoriesWithChain = async (searchTerm, filters = {}) => {
  const matchedCategories = await dao.searchCategoriesByName(searchTerm);
  const allCategories = await dao.getAllCategories(filters);

  return matchedCategories.map((category) => {
    const result = getCategoryAncestorsWithRoot(allCategories, category.id);
    const chain = [...result.ancestors.map((a) => a.name), category.name];
    return {
      name: category.name,
      id: category.id,
      publicId: category.publicId,
      slug: category.slug,
      breadCrumb: category.breadCrumb,
      departmentId: result.topmostParentId,
      parentId: category.parentId,
      chain,
    };
  });
};

exports.getLastUsedCategoryWithChain = async (userId) => {
  const lastCatalogue = await catalogueDao.getLastCatalogueByUserId(userId);
  const categoryId = lastCatalogue?.categoryId;

  if (!categoryId) {
    throw new NotFoundError("No last used category found for user");
  }

  const allCategories = await dao.getAllCategories({
    isVisible: true,
    isDeleted: false,
  });
  const category = allCategories.find((cat) => cat.id === categoryId);

  if (!category) {
    throw new NotFoundError("Category not found in available categories");
  }

  const { ancestors, topmostParentId } = getCategoryAncestorsWithRoot(
    allCategories,
    category.id
  );

  return {
    id: category.id,
    name: category.name,
    departmentId: topmostParentId,
    chain: [...ancestors.map((a) => a.name), category.name],
  };
};

exports.getLeafCategoriesForMobile = async () => {
  const allCategories = await dao.getAllCategoriesForLeafFilter();

  if (!Array.isArray(allCategories) || allCategories.length === 0) {
    return [];
  }

  const childrenMap = new Map();
  allCategories.forEach((category) => {
    if (category.parentId) {
      if (!childrenMap.has(category.parentId)) {
        childrenMap.set(category.parentId, []);
      }
      childrenMap.get(category.parentId).push(category);
    }
  });

  const categoriesWithChildren = new Set();
  allCategories.forEach((category) => {
    if (childrenMap.has(category.id)) {
      categoriesWithChildren.add(category.id);
    }
  });

  const rootCategories = allCategories.filter(
    (category) => Number(category.parentId) === 769
    //  category.showOnMobile === true
  );

  const findAllDescendants = (categoryId) => {
    const descendants = [];
    const children = childrenMap.get(categoryId) || [];

    children.forEach((child) => {
      descendants.push(child);
      const childDescendants = findAllDescendants(child.id);
      descendants.push(...childDescendants);
    });

    return descendants;
  };

  const result = rootCategories.map((rootCategory) => {
    const rootCategoryData = rootCategory.toJSON
      ? rootCategory.toJSON()
      : rootCategory;
    const descendants = findAllDescendants(rootCategory.id);

    const leafNodes = descendants
      .filter((category) => !categoriesWithChildren.has(category.id))
      .map((category) => {
        const categoryData = category.toJSON ? category.toJSON() : category;
        return {
          id: categoryData.id,
          publicId: categoryData.publicId,
          name: categoryData.name,
          slug: categoryData.slug,
          parentId: categoryData.parentId,
          breadCrumb: categoryData.breadCrumb || "",
          displayOrderWeb: categoryData.displayOrderWeb || 1,
          children: [],
        };
      })
      .sort((a, b) => {
        if (a.displayOrderWeb !== b.displayOrderWeb) {
          return a.displayOrderWeb - b.displayOrderWeb;
        }
        return a.name.localeCompare(b.name);
      });

    return {
      id: rootCategoryData.id,
      publicId: rootCategoryData.publicId,
      name: rootCategoryData.name,
      slug: rootCategoryData.slug,
      parentId: rootCategoryData.parentId,
      breadCrumb: rootCategoryData.breadCrumb || "",
      displayOrderWeb: rootCategoryData.displayOrderWeb || 1,
      children: leafNodes,
    };
  });

  return result.sort((a, b) => {
    if (a.displayOrderWeb !== b.displayOrderWeb) {
      return a.displayOrderWeb - b.displayOrderWeb;
    }
    return a.name.localeCompare(b.name);
  });
};

exports.getCategoryChildrenOrSiblings = async (categoryId) => {
  const category = await dao.getCategoryById(categoryId);
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }

  return await dao.getCategoryChildrenOrSiblings(categoryId);
};

exports.searchCategoryFilters = async (searchTerm) => {
  const filters = { isVisible: true, isDeleted: false };
  const matchedCategories = await exports.searchCategoriesWithChain(
    searchTerm,
    filters
  );

  let selectedCategoryId;
  let categoryInfo;

  if (matchedCategories.length > 0) {
    selectedCategoryId = matchedCategories[0].id;
    categoryInfo = {
      id: matchedCategories[0].id,
      name: matchedCategories[0].name,
    };
  } else {
    selectedCategoryId = 7;
    const defaultCategory = await dao.getCategoryById(selectedCategoryId);
    if (!defaultCategory || defaultCategory.isDeleted) {
      throw new NotFoundError("Default category not found");
    }

    categoryInfo = {
      id: defaultCategory.id,
      name: defaultCategory.name,
    };
  }

  const filtersData = await categorySchemaService.getAvailableFilters(
    selectedCategoryId
  );

  return {
    category: categoryInfo,
    filters: filtersData,
  };
};



exports.getCategoryDetailsById = async (id) => {
  const category = await dao.getCategoryById(id);

  if (!category) return null;

  const children = await dao.getCategoriesByParentId(id);
  const parent = category.parentId
    ? await dao.getCategoryById(category.parentId)
    : null;

  return {
    category,
    parent,
    children,
  };
};
