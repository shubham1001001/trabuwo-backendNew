const OriginalBrandCategory = require("./originalBrandModel");

const findAll = async (filter = {}) => {
  return await OriginalBrandCategory.findAll({
    where: { ...filter, isDeleted: false },
    order: [["display_order", "ASC"]],
  });
};

const findOne = async (filter = {}) => {
  return await OriginalBrandCategory.findOne({
    where: { ...filter, isDeleted: false },
  });
};

const create = async (data) => {
  return await OriginalBrandCategory.create(data);
};

const update = async (publicId, data) => {
  return await OriginalBrandCategory.update(data, {
    where: { publicId, isDeleted: false },
  });
};

const deleteOne = async (publicId) => {
  return await OriginalBrandCategory.update(
    { isDeleted: true },
    { where: { publicId } }
  );
};

module.exports = {
  findAll,
  findOne,
  create,
  update,
  deleteOne,
};
