const dao = require("./dao");
const categoryDao = require("../category/dao");
const { NotFoundError } = require("../../utils/errors");

function normalizeFilterToArrays(filter) {
  if (filter == null || typeof filter !== "object" || Array.isArray(filter)) {
    return filter == null ? null : filter;
  }
  const out = {};
  Object.keys(filter).forEach((key) => {
    const val = filter[key];
    out[key] = Array.isArray(val) ? [...val] : [val];
  });
  return out;
}

exports.createSection = async (payload) => {
  const category = await categoryDao.getCategoryById(payload.categoryId);
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }
  const filter =
    payload.filter !== undefined
      ? normalizeFilterToArrays(payload.filter)
      : null;
  return await dao.createSection({
    categoryId: payload.categoryId,
    name: payload.name,
    displayOrder: payload.displayOrder,
    layout: payload.layout !== undefined ? payload.layout : "grid",
    column: payload.column !== undefined ? payload.column : 3,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
    filter,
  });
};

exports.getPublicSectionsByCategoryId = async (
  categoryId,
  deviceType,
  filter
) => {
  return await dao.getSectionsWithAssetsByCategoryId(
    categoryId,
    deviceType,
    filter
  );
};

exports.updateSection = async (publicId, payload) => {
  const existingSection = await dao.getSectionByPublicId(publicId);
  if (!existingSection) {
    throw new NotFoundError("Category section not found");
  }

  if (payload.categoryId !== undefined) {
    const category = await categoryDao.getCategoryById(payload.categoryId);
    if (!category || category.isDeleted) {
      throw new NotFoundError("Category not found");
    }
  }

  const updateData = {};
  if (payload.categoryId !== undefined) {
    updateData.categoryId = payload.categoryId;
  }
  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }
  if (payload.displayOrder !== undefined) {
    updateData.displayOrder = payload.displayOrder;
  }
  if (payload.layout !== undefined) {
    updateData.layout = payload.layout;
  }
  if (payload.column !== undefined) {
    updateData.column = payload.column;
  }
  if (payload.isActive !== undefined) {
    updateData.isActive = payload.isActive;
  }
  if (payload.filter !== undefined) {
    updateData.filter = normalizeFilterToArrays(payload.filter);
  }

  return await dao.updateSectionById(existingSection.id, updateData);
};
