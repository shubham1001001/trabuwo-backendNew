const Category = require("./model");
const {
  buildCategoryTree,
  getAllLeafDescendants,
  generateUniqueHierarchicalSlug,
} = require("./helper");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../../config/database");
const { DatabaseError } = require("../../utils/errors");

exports.createCategory = async (data) => {
  const allCategories = await Category.findAll({
    where: { isDeleted: false },
  });

  // Ensure parentId is properly handled (could be 0, null, or undefined)
  const parentId = data.parentId != null ? data.parentId : null;

  const slug = generateUniqueHierarchicalSlug(
    allCategories,
    null,
    data.name,
    parentId,
    null,
  );

  return await Category.create({
    ...data,
    slug,
  });
};

exports.getCategoryById = async (id) => {
  return await Category.findByPk(id);
};

exports.getCategoryByPublicId = async (publicId) => {
  return await Category.findOne({
    where: { publicId, isDeleted: false },
  });
};

exports.findCategoryBySlugOrName = async (value) => {
  return await Category.findOne({
    where: {
      isDeleted: false,
      [Op.or]: [{ slug: value }, { name: value }],
    },
  });
};

exports.getAllCategories = async (filters = {}) => {
  return await Category.findAll({
    where: filters,
    order: [
      [literal('"display_order_web" ASC NULLS LAST')],
      ["name", "ASC"],
    ],
  });
};

exports.getAllCategoriesPlain = async (filters = {}) => {
  return await Category.findAll({
    where: filters,
    order: [["name", "ASC"]],
    attributes: ["id", "parentId"],
  });
};
exports.getSelectedCategoriesForWeb = async (filters = {}) => {
  return await Category.findAll({
    where: filters,
    order: [[literal('"display_order_web" ASC NULLS LAST')]],
  });
};

exports.updateCategoryById = async (id, data) => {
  const categoryId = parseInt(id);
  if (isNaN(categoryId)) {
    throw new Error("Invalid category ID");
  }

  // Check if category exists and is not deleted first
  const currentCategory = await Category.findByPk(categoryId);
  if (!currentCategory || currentCategory.isDeleted) {
    throw new Error("Category not found");
  }

  const payload = { ...data };

  if (payload.name || payload.parentId !== undefined) {
    const allCategories = await Category.findAll({
      where: { isDeleted: false },
    });

    const categoryName = payload.name || currentCategory.name;
    const parentId =
      payload.parentId !== undefined
        ? payload.parentId
        : currentCategory.parentId;

    payload.slug = generateUniqueHierarchicalSlug(
      allCategories,
      categoryId,
      categoryName,
      parentId,
      categoryId,
    );
  }

  // If payload is empty after processing, return [1] to indicate row was found
  if (Object.keys(payload).length === 0) {
    return [1];
  }

  return await Category.update(payload, {
    where: { id: categoryId, isDeleted: false },
    returning: true,
  });
};

exports.softDeleteCategoryById = async (id) => {
  return await Category.update({ isDeleted: true }, { where: { id } });
};

exports.getCategoriesByParentId = async (parentId) => {
  return await Category.findAll({
    where: {
      parentId,
      isDeleted: false,
    },
    order: [
      [literal('"display_order_web" ASC NULLS LAST')],
      ["name", "ASC"],
    ],
  });
};

exports.getCategoryTree = async () => {
  const categories = await Category.findAll({
    where: {
      isDeleted: false,
      isVisible: true,
    },
    order: [
      [literal('"display_order_web" ASC NULLS LAST')],
      ["name", "ASC"],
    ],
  });
  return buildCategoryTree(categories, null);
};

exports.getCategoryWithChildren = async (id) => {
  return await Category.findByPk(id, {
    include: [
      {
        model: Category,
        as: "children",
        where: { isDeleted: false },
        required: false,
        order: [[literal('"display_order_web" ASC NULLS LAST')]],
      },
    ],
  });
};

exports.getCategoryWithParent = async (id) => {
  return await Category.findByPk(id, {
    include: [
      {
        model: Category,
        as: "parent",
        where: { isDeleted: false },
        required: false,
      },
    ],
  });
};

exports.bulkUpdateCategories = async (updates) => {
  try {
    const transaction = await Category.sequelize.transaction();
    try {
      const results = [];
      for (const update of updates) {
        const result = await Category.update(update.data, {
          where: { id: update.id },
          transaction,
        });
        results.push(result);
      }
      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw new DatabaseError("Failed to bulk update categories", error.message);
  }
};

exports.searchCategoriesByName = async (term, limit = 5, threshold = 0.2) => {
  return await Category.findAll({
    where: {
      isDeleted: false,
      isVisible: true,
      [Op.and]: literal(
        `similarity(name, ${sequelize.escape(term)}) > ${threshold}`,
      ),
    },
    attributes: {
      include: [[fn("similarity", col("name"), term), "similarity_score"]],
    },
    order: [[literal("similarity_score"), "DESC"]],
    limit,
  });
};

exports.bulkUpsertCategoryBreadcrumbs = async (updates) => {
  if (!Array.isArray(updates) || updates.length === 0) return true;
  await Category.bulkCreate(updates, {
    updateOnDuplicate: ["breadCrumb"],
    validate: false,
  });
  return true;
};

exports.getAllCategoriesForLeafFilter = async () => {
  return await Category.findAll({
    where: {
      isVisible: true,
      isDeleted: false,
    },
    order: [
      [literal('"display_order_web" ASC NULLS LAST')],
      ["name", "ASC"],
    ],
  });
};

exports.getCategoryChildrenOrSiblings = async (categoryId) => {
  const category = await Category.findByPk(categoryId);
  if (!category || category.isDeleted) {
    return [];
  }

  // Get all categories for building tree structure
  const allCategories = await Category.findAll({
    where: { isDeleted: false },
    order: [["name", "ASC"]],
  });

  // Build children map to check if category has children
  const childrenMap = new Map();
  allCategories.forEach((cat) => {
    if (cat.parentId) {
      if (!childrenMap.has(cat.parentId)) {
        childrenMap.set(cat.parentId, []);
      }
      childrenMap.get(cat.parentId).push(cat);
    }
  });

  // Identify categories that have children
  const categoriesWithChildren = new Set();
  allCategories.forEach((cat) => {
    if (childrenMap.has(cat.id)) {
      categoriesWithChildren.add(cat.id);
    }
  });

  // Check if category has children
  const hasChildren = categoriesWithChildren.has(categoryId);

  if (hasChildren) {
    // Return all leaf descendants
    const leafDescendants = getAllLeafDescendants(allCategories, categoryId);
    return leafDescendants.sort((a, b) => {
      const orderA = a.displayOrderWeb != null ? a.displayOrderWeb : 999999;
      const orderB = b.displayOrderWeb != null ? b.displayOrderWeb : 999999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
  } else {
    // Return leaf siblings (categories with same parentId that are leaves) including the category itself
    const siblings = allCategories.filter(
      (cat) =>
        cat.parentId === category.parentId &&
        !categoriesWithChildren.has(cat.id),
    );
    return siblings.sort((a, b) => {
      const orderA = a.displayOrderWeb != null ? a.displayOrderWeb : 999999;
      const orderB = b.displayOrderWeb != null ? b.displayOrderWeb : 999999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
  }
};

/**
 * Regenerates slug for a category and all its descendants
 * @param {number} categoryId - ID of the category
 * @returns {Promise<boolean>} Success status
 */
const MAX_DEPTH = 100;

exports.regenerateSlugForCategoryAndDescendants = async (categoryId) => {
  return await sequelize.transaction(async (t) => {
    const visitedDescendants = new Set();

    const getDescendants = async (parentId, all = []) => {
      if (visitedDescendants.size >= MAX_DEPTH) {
        throw new DatabaseError(
          `Category hierarchy exceeds maximum depth of ${MAX_DEPTH}. Possible circular reference in parent-child relationships.`,
        );
      }
      const children = await Category.findAll({
        where: { parentId, isDeleted: false },
        transaction: t,
      });
      for (const child of children) {
        if (visitedDescendants.has(child.id)) {
          throw new DatabaseError(
            `Circular reference detected in category hierarchy at category ID ${child.id}. Please fix the parent-child relationships in the database.`,
          );
        }
        visitedDescendants.add(child.id);
        all.push(child);
        await getDescendants(child.id, all);
      }
      return all;
    };

    const category = await Category.findByPk(categoryId, { transaction: t });
    if (!category) {
      return false;
    }

    const descendants = await getDescendants(categoryId);
    const allToUpdate = [category, ...descendants];

    const getDepth = (cat, allCats) => {
      const visited = new Set();
      let depth = 0;
      let current = cat;
      while (current && current.parentId && depth < MAX_DEPTH) {
        if (visited.has(current.id)) {
          throw new DatabaseError(
            `Circular reference detected in category hierarchy at category ID ${current.id}. Please fix the parent-child relationships in the database.`,
          );
        }
        visited.add(current.id);
        current = allCats.find((c) => c.id === current.parentId);
        if (current) depth++;
        else break;
      }
      return depth;
    };

    allToUpdate.sort((a, b) => {
      const depthA = getDepth(a, allToUpdate);
      const depthB = getDepth(b, allToUpdate);
      if (depthA !== depthB) return depthA - depthB;
      return a.id - b.id;
    });

    for (const cat of allToUpdate) {
      const allCategories = await Category.findAll({
        where: { isDeleted: false },
        transaction: t,
      });

      const freshCat = allCategories.find((c) => c.id === cat.id);
      if (!freshCat) continue;

      const newSlug = generateUniqueHierarchicalSlug(
        allCategories,
        freshCat.id,
        freshCat.name,
        freshCat.parentId,
        freshCat.id,
      );

      await Category.update(
        { slug: newSlug },
        { where: { id: freshCat.id }, transaction: t },
      );
    }

    return true;
  });
};
