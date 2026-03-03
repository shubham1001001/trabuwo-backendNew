const MAX_DEPTH = 100;

/**
 * Returns true if setting entity E's parent to proposedParentId would create a circular dependency.
 * A cycle occurs when proposedParentId is a descendant of entityId (i.e. entityId is an ancestor of proposedParentId).
 * Walks from proposedParentId upward by parentId; if we reach entityId, the update would create a cycle.
 * @param {Array<{ id: number, parentId: number|null }>} nodes - Flat list of nodes with id and parentId
 * @param {number} entityId - The entity being updated
 * @param {number} proposedParentId - The new parentId value (must not be null when calling)
 * @returns {boolean} true if the update would create a circular dependency, false otherwise
 */
function wouldCreateCycle(nodes, entityId, proposedParentId) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return false;
  }

  const idToNode = new Map();
  nodes.forEach((n) => {
    const parentId = n.parentId != null && n.parentId !== 0 ? n.parentId : null;
    idToNode.set(n.id, { id: n.id, parentId });
  });

  const visited = new Set();
  let currentId = proposedParentId;
  let depth = 0;

  while (currentId != null && currentId !== 0 && depth < MAX_DEPTH) {
    if (currentId === entityId) {
      return true;
    }
    if (visited.has(currentId)) {
      return true;
    }
    visited.add(currentId);

    const node = idToNode.get(currentId);
    if (!node || node.parentId == null) {
      break;
    }
    currentId = node.parentId;
    depth++;
  }

  return false;
}

module.exports = {
  wouldCreateCycle,
};
