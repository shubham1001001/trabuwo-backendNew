const { DatabaseError } = require("../../utils/errors");

const MAX_DEPTH = 100;

/**
 * Builds a hierarchical tree structure from a flat array of home categories
 * Children are grouped by sectionId with section name as key
 * @param {Array} homeCategories - Array of home category objects
 * @param {number|null} parentId - Parent ID to filter by (null for root categories)
 * @param {Set} [pathFromRoot] - Set of category IDs from root to current (used to detect circular references)
 * @returns {Array} Hierarchical tree structure
 */
function buildHomeCategoryTree(homeCategories, parentId = null, pathFromRoot = new Set()) {
  if (!Array.isArray(homeCategories)) {
    return [];
  }

  if (pathFromRoot.size >= MAX_DEPTH) {
    throw new DatabaseError(
      `Home category hierarchy exceeds maximum depth of ${MAX_DEPTH}. Possible circular reference in parent-child relationships.`,
    );
  }

  return homeCategories
    .filter((cat) => {
      const catData = cat.dataValues || cat;
      return catData.parentId === parentId;
    })
    .map((cat) => {
      const catData = cat.dataValues || cat;
      if (pathFromRoot.has(catData.id)) {
        throw new DatabaseError(
          `Circular reference detected in home category hierarchy at category ID ${catData.id}. Please fix the parent-child relationships in the database.`,
        );
      }
      const nextPath = new Set(pathFromRoot).add(catData.id);
      const children = buildHomeCategoryTree(homeCategories, catData.id, nextPath);

      // Group children by sectionId with section name as key
      const childrenBySection = {};
      children.forEach((child) => {
        const childData = child.dataValues || child;
        const section = childData.section || null;
        const sectionData = section?.dataValues || section;
        const sectionName = sectionData?.name || "Uncategorized";
        if (!childrenBySection[sectionName]) {
          childrenBySection[sectionName] = [];
        }
        childrenBySection[sectionName].push(child);
      });

      // Convert to array format: [{ sectionName: "...", children: [...] }]
      const childrenArray =
        Object.keys(childrenBySection).length > 0
          ? Object.keys(childrenBySection)
              .sort()
              .map((sectionName) => ({
                sectionName,
                children: childrenBySection[sectionName],
              }))
          : undefined;

      const result = {
        ...catData,
        children: childrenArray,
      };

      return result;
    })
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name);
    });
}

module.exports = {
  buildHomeCategoryTree,
};
