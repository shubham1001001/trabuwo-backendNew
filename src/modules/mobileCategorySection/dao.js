const MobileCategorySection = require("./model");
const Category = require("../category/model");
const { Op } = require("sequelize");

exports.create = async (data) => {
  return await MobileCategorySection.create(data);
};

exports.getAll = async (filters = {}) => {
  const where = { isDeleted: false, ...filters };
  return await MobileCategorySection.findAll({
    where,
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "breadCrumb"],
      },
    ],
    order: [["displayOrder", "ASC"]],
  });
};

exports.getById = async (id) => {
  return await MobileCategorySection.findOne({
    where: {
      [Op.or]: [{ id: isNaN(id) ? -1 : id }, { publicId: id }],
      isDeleted: false,
    },
    include: [{ model: Category, as: "category" }],
  });
};

exports.update = async (id, data) => {
  return await MobileCategorySection.update(data, {
    where: {
      [Op.or]: [{ id: isNaN(id) ? -1 : id }, { publicId: id }],
    },
  });
};

exports.getByCategoryId = async (categoryId) => {
  return await MobileCategorySection.findAll({
    where: { categoryId, isVisible: true, isDeleted: false },
    attributes: ["id", "publicId", "name", "displayOrder", "imageUrl", "tiles"],
    order: [["displayOrder", "ASC"]],
  });
};

exports.delete = async (id) => {
  return await MobileCategorySection.update(
    { isDeleted: true },
    {
      where: {
        [Op.or]: [{ id: isNaN(id) ? -1 : id }, { publicId: id }],
      },
    }
  );
};
