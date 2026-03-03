const CategoryIcon = require("./model");

exports.createCategoryIcon = async (data, { transaction } = {}) => {
  return await CategoryIcon.create(data, { transaction });
};

exports.updateCategoryIconById = async (id, data, { transaction } = {}) => {
  await CategoryIcon.update(data, { where: { id }, transaction });
  return await CategoryIcon.findByPk(id, { transaction });
};

exports.getCategoryIconByPublicId = async (publicId, { transaction } = {}) => {
  return await CategoryIcon.findOne({
    where: { publicId, isDeleted: false },
    transaction,
  });
};

exports.getCategoryIconsByCategoryId = async (
  categoryId,
  { transaction } = {}
) => {
  return await CategoryIcon.findAll({
    where: { categoryId, isDeleted: false, enabled: true },
    order: [["id", "ASC"]],
    transaction,
  });
};

exports.softDeleteCategoryIconById = async (id, { transaction } = {}) => {
  return await CategoryIcon.update(
    { isDeleted: true, enabled: false },
    { where: { id }, transaction }
  );
};
