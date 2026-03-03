const slugify = require("slugify");
const { DatabaseError } = require("../../utils/errors");

const MAX_DEPTH = 100;

/**
 * Builds a hierarchical tree structure from a flat array of categories.
 * Uses an iterative algorithm (single pass + parent-child linking) to avoid
 * deep recursion and high memory usage when category count is large.
 * @param {Array} categories - Array of category objects
 * @param {number|null} parentId - Parent ID to filter by (null for root categories); kept for API compatibility, iterative build ignores and builds full tree
 * @param {Set} [_pathFromRoot] - Unused in iterative path; kept for API compatibility
 * @returns {Array} Hierarchical tree structure
 */
// eslint-disable-next-line no-unused-vars -- kept for API compatibility with callers passing (categories, parentId, pathFromRoot)
function buildCategoryTree(categories, parentId = null, _pathFromRoot = new Set()) {
  if (!Array.isArray(categories)) {
    return [];
  }

  const idToNode = new Map();
  for (const cat of categories) {
    const node = {
      ...(cat.dataValues || cat),
      children: [],
    };
    idToNode.set(cat.id, node);
  }

  const roots = [];
  for (const cat of categories) {
    const node = idToNode.get(cat.id);
    const pid = cat.parentId;
    if (pid == null || pid === 0 || !idToNode.has(pid)) {
      roots.push(node);
    } else {
      const parent = idToNode.get(pid);
      parent.children.push(node);
    }
  }

  const visited = new Set();
  const stack = [...roots];
  let depth = 0;
  while (stack.length > 0 && depth < MAX_DEPTH * 2) {
    const node = stack.pop();
    if (visited.has(node.id)) {
      throw new DatabaseError(
        `Circular reference detected in category hierarchy at category ID ${node.id}. Please fix the parent-child relationships in the database.`,
      );
    }
    visited.add(node.id);
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push(node.children[i]);
    }
    depth++;
  }

  const sortByDisplayOrder = (nodes) =>
    nodes.sort((a, b) => (a.displayOrderWeb || 0) - (b.displayOrderWeb || 0));
  function sortTree(nodes) {
    sortByDisplayOrder(nodes);
    nodes.forEach((n) => {
      if (n.children && n.children.length > 0) sortTree(n.children);
    });
  }
  sortTree(roots);

  if (parentId != null && parentId !== 0) {
    const parentNode = idToNode.get(parentId);
    return parentNode ? parentNode.children : [];
  }
  return roots;
}

/**
 * Flattens a hierarchical tree structure back to a flat array
 * @param {Array} tree - Hierarchical tree structure
 * @returns {Array} Flat array of categories
 */
function flattenCategoryTree(tree) {
  if (!Array.isArray(tree)) {
    return [];
  }

  const result = [];

  function traverse(node) {
    const { children, ...categoryData } = node;
    result.push(categoryData);

    if (children && children.length > 0) {
      children.forEach(traverse);
    }
  }

  tree.forEach(traverse);
  return result;
}

/**
 * Gets the depth level of a category in the tree
 * @param {Array} categories - Array of category objects
 * @param {number} categoryId - ID of the category
 * @returns {number} Depth level (0 for root, 1 for first level, etc.)
 */
function getCategoryDepth(categories, categoryId) {
  if (!Array.isArray(categories)) {
    return 0;
  }

  // Build a Map for O(1) lookup instead of O(n) find()
  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat);
  });

  let depth = 0;
  let currentId = categoryId;
  const visited = new Set(); // Track visited IDs to detect circular references
  const MAX_DEPTH = 100; // Safety limit to prevent infinite loops

  while (currentId && depth < MAX_DEPTH) {
    // Detect circular reference
    if (visited.has(currentId)) {
      // Circular reference detected - throw error to alert about data integrity issue
      throw new DatabaseError(
        `Circular reference detected in category hierarchy at category ID ${currentId}. Please fix the parent-child relationships in the database.`,
      );
    }
    visited.add(currentId);

    const category = categoryMap.get(currentId);
    if (!category || !category.parentId) {
      break;
    }
    currentId = category.parentId;
    depth++;
  }

  return depth;
}

/**
 * Gets all ancestor categories of a given category
 * @param {Array} categories - Array of category objects
 * @param {number} categoryId - ID of the category
 * @returns {Object}  { ancestors, topmostParentId }
 */
function getCategoryAncestorsWithRoot(categories, categoryId) {
  if (!Array.isArray(categories)) {
    return { ancestors: [], topmostParentId: null };
  }

  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat);
  });

  const ancestors = [];
  let currentId = categoryId;
  let topmostParentId = null;
  const visited = new Set(); // Track visited IDs to detect circular references
  const MAX_DEPTH = 100; // Safety limit to prevent infinite loops
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    if (visited.has(currentId)) {
      throw new DatabaseError(
        `Circular reference detected in category hierarchy at category ID ${currentId}. Please fix the parent-child relationships in the database.`,
      );
    }
    visited.add(currentId);

    const category = categoryMap.get(currentId);
    if (!category || !category.parentId) {
      break;
    }

    const parent = categoryMap.get(category.parentId);
    if (parent) {
      ancestors.unshift(parent);
      topmostParentId = parent.id;
    }

    currentId = category.parentId;
    depth++;
  }

  return { ancestors, topmostParentId };
}

function getAllLeafDescendants(categories, categoryId) {
  if (!Array.isArray(categories) || categories.length === 0) return [];

  // 1. Build a map of parent -> children in one pass
  // Also track which IDs have children to identify leaves
  const childrenMap = new Map();
  const hasChildren = new Set();

  for (const cat of categories) {
    if (cat.parentId) {
      if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, []);
      childrenMap.get(cat.parentId).push(cat);
      hasChildren.add(cat.parentId);
    }
  }

  const leafDescendants = [];
  const visited = new Set();
  const stack = [...(childrenMap.get(categoryId) || [])];

  // 2. Iterative Depth-First Search (DFS) with circular reference detection
  while (stack.length > 0) {
    const current = stack.pop();

    if (visited.has(current.id)) {
      throw new DatabaseError(
        `Circular reference detected in category hierarchy at category ID ${current.id}. Please fix the parent-child relationships in the database.`,
      );
    }
    visited.add(current.id);

    if (!hasChildren.has(current.id)) {
      leafDescendants.push(current);
    } else {
      const children = childrenMap.get(current.id);
      if (children) {
        for (const child of children) {
          if (visited.has(child.id)) {
            throw new DatabaseError(
              `Circular reference detected in category hierarchy at category ID ${child.id}. Please fix the parent-child relationships in the database.`,
            );
          }
          stack.push(child);
        }
      }
    }
  }

  return leafDescendants;
}

/**
 * Generates a unique hierarchical slug for a category
 * Format: parent-slug/child-slug (e.g., "electronics/accessories")
 * @param {Array} categories - Array of all category objects
 * @param {number|null} categoryId - ID of the category (null for new category)
 * @param {string} categoryName - Name of the category
 * @param {number|null} parentId - Parent category ID
 * @param {number|null} excludeCategoryId - Category ID to exclude from uniqueness check
 * @returns {string} Unique hierarchical slug
 */
function generateUniqueHierarchicalSlug(
  categories,
  categoryId,
  categoryName,
  parentId = null,
  excludeCategoryId = null,
) {
  if (!Array.isArray(categories) || !categoryName) {
    return "";
  }

  // Build slug path from root to current category using names
  const namePath = [];

  // Check if parentId is provided and valid
  if (parentId != null && parentId !== 0) {
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
  const slugParts = namePath
    .map((name) => slugify(name, { lower: true, strict: true }))
    .filter(Boolean); // Remove any empty strings

  const baseSlug = slugParts.join("/");

  if (!baseSlug) {
    return "";
  }

  // Check if slug already exists (excluding self)
  const exists = categories.some((cat) => {
    if (cat.isDeleted) return false;
    if (categoryId && cat.id === categoryId) return false;
    if (excludeCategoryId && cat.id === excludeCategoryId) return false;
    return cat.slug === baseSlug;
  });

  if (!exists) {
    return baseSlug;
  }

  // Find next available suffix
  const suffixPattern = new RegExp(
    `^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`,
  );
  let maxSuffix = 0;

  categories.forEach((cat) => {
    if (cat.isDeleted) return;
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
  buildCategoryTree,
  flattenCategoryTree,
  getCategoryDepth,
  getCategoryAncestorsWithRoot,
  getAllLeafDescendants,
  generateUniqueHierarchicalSlug,
};
