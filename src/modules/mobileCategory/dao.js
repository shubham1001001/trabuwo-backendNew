const MobileCategory = require("./model");
const { Op, literal } = require("sequelize");

exports.createCategory = async (data) => {
  return await MobileCategory.create(data);
};

exports.getCategoryById = async (id) => {
  return await MobileCategory.findByPk(id);
};

exports.getCategoryByPublicId = async (publicId) => {
  return await MobileCategory.findOne({
    where: { publicId, isDeleted: false },
  });
};

exports.getAllCategories = async (filters = {}) => {
  return await MobileCategory.findAll({
    where: { ...filters, isDeleted: false },
    order: [["displayOrder", "ASC"], ["name", "ASC"]],
  });
};

exports.updateCategoryById = async (id, data) => {
  return await MobileCategory.update(data, {
    where: { id, isDeleted: false },
    returning: true,
  });
};

exports.softDeleteCategoryById = async (id) => {
  return await MobileCategory.update({ isDeleted: true }, { where: { id } });
};

exports.getCategoriesByParentId = async (parentId) => {
  return await MobileCategory.findAll({
    where: { parentId, isDeleted: false },
    order: [["displayOrder", "ASC"], ["name", "ASC"]],
  });
};
