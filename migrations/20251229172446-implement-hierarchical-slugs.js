"use strict";

const slugify = require("slugify");

const MAX_DEPTH = 100;

/**
 * Gets all ancestor categories of a given category
 */
function getCategoryAncestorsWithRoot(categories, categoryId) {
  if (!Array.isArray(categories)) {
    return { ancestors: [], topmostParentId: null };
  }

  const ancestors = [];
  let currentId = categoryId;
  let topmostParentId = null;
  const visited = new Set();
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    if (visited.has(currentId)) {
      throw new Error(
        `Circular reference detected in category hierarchy at category ID ${currentId}. Fix parent-child relationships before running migration.`
      );
    }
    visited.add(currentId);

    const category = categories.find((cat) => cat.id === currentId);
    if (!category || !category.parent_id) {
      break;
    }

    const parent = categories.find((cat) => cat.id === category.parent_id);
    if (parent) {
      ancestors.unshift(parent);
      topmostParentId = parent.id;
    }

    currentId = category.parent_id;
    depth++;
  }

  return { ancestors, topmostParentId };
}

/**
 * Generates a unique hierarchical slug for a category
 */
function generateUniqueHierarchicalSlug(
  categories,
  categoryId,
  categoryName,
  parentId = null,
  excludeCategoryId = null
) {
  if (!Array.isArray(categories) || !categoryName) {
    return "";
  }

  // Build slug path from root to current category using names
  const namePath = [];

  if (parentId) {
    const parent = categories.find((cat) => cat.id === parentId);
    if (parent) {
      // Get all ancestors of the parent
      const { ancestors } = getCategoryAncestorsWithRoot(categories, parentId);
      // Add ancestor names
      ancestors.forEach((ancestor) => {
        namePath.push(ancestor.name);
      });
      // Add parent name
      namePath.push(parent.name);
    }
  }

  // Add current category name
  namePath.push(categoryName);

  // Convert each name to slug and join with "/"
  const slugParts = namePath.map((name) =>
    slugify(name, { lower: true, strict: true })
  );

  const baseSlug = slugParts.join("/");

  if (!baseSlug) {
    return "";
  }

  // Check if slug exists (excluding self)
  const exists = categories.some((cat) => {
    if (cat.is_deleted) return false;
    if (categoryId && cat.id === categoryId) return false;
    if (excludeCategoryId && cat.id === excludeCategoryId) return false;
    return cat.slug === baseSlug;
  });

  if (!exists) {
    return baseSlug;
  }

  // Find next available suffix
  const suffixPattern = new RegExp(
    `^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`
  );
  let maxSuffix = 0;

  categories.forEach((cat) => {
    if (cat.is_deleted) return;
    if (categoryId && cat.id === categoryId) return;
    if (excludeCategoryId && cat.id === excludeCategoryId) return;

    if (cat.slug === baseSlug) {
      maxSuffix = Math.max(maxSuffix, 1);
    } else {
      const match = cat.slug.match(suffixPattern);
      if (match) {
        maxSuffix = Math.max(maxSuffix, parseInt(match[1], 10));
      }
    }
  });

  return `${baseSlug}-${maxSuffix + 1}`;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // Increase slug column length from VARCHAR(100) to VARCHAR(255)
    await queryInterface.changeColumn("categories", "slug", {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    });

    // Get all categories
    const [categories] = await queryInterface.sequelize.query(`
      SELECT id, name, parent_id, slug, is_deleted
      FROM categories
      WHERE is_deleted = false
      ORDER BY id
    `);

    // Calculate depth for each category and sort by depth (root first, then children)
    const getDepth = (catId, catMap) => {
      const visited = new Set();
      let depth = 0;
      let currentId = catId;
      while (currentId && depth < MAX_DEPTH) {
        if (visited.has(currentId)) {
          throw new Error(
            `Circular reference detected in category hierarchy at category ID ${currentId}. Fix parent-child relationships before running migration.`
          );
        }
        visited.add(currentId);
        const cat = catMap.get(currentId);
        if (!cat || !cat.parent_id) break;
        currentId = cat.parent_id;
        depth++;
      }
      return depth;
    };

    const catMap = new Map(categories.map((cat) => [cat.id, cat]));
    categories.forEach((cat) => {
      cat.depth = getDepth(cat.id, catMap);
    });
    categories.sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }
      return a.id - b.id;
    });

    // Regenerate slugs for each category in order
    for (const category of categories) {
      const newSlug = generateUniqueHierarchicalSlug(
        categories,
        category.id,
        category.name,
        category.parent_id,
        null
      );

      if (newSlug && newSlug !== category.slug) {
        await queryInterface.sequelize.query(
          `
          UPDATE categories
          SET slug = :newSlug
          WHERE id = :categoryId
        `,
          {
            replacements: { newSlug, categoryId: category.id },
          }
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert slug column length back to VARCHAR(100)
    // Note: This may fail if any slugs are longer than 100 characters
    await queryInterface.changeColumn("categories", "slug", {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    });

    // Note: We cannot easily revert to flat slugs without knowing the original names
    // The down migration only reverts the column size change
  },
};
