const HomeCategory = require("./model");
const { buildHomeCategoryTree } = require("./helper");
const { Op } = require("sequelize");

exports.createHomeCategory = async (data) => {
  return await HomeCategory.create(data);
};

exports.getHomeCategoryById = async (id) => {
  return await HomeCategory.findByPk(id);
};

exports.getAllHomeCategories = async (filters = {}) => {
  return await HomeCategory.findAll({
    where: filters,
    order: [
      ["displayOrder", "ASC"],
      ["name", "ASC"],
    ],
  });
};

exports.updateHomeCategoryById = async (id, data, { transaction } = {}) => {
  return await HomeCategory.update(data, {
    where: { id },
    returning: true,
    transaction,
  });
};

exports.softDeleteHomeCategoryById = async (id) => {
  return await HomeCategory.update({ isDeleted: true }, { where: { id } });
};

exports.getHomeCategoriesByParentId = async (parentId) => {
  return await HomeCategory.findAll({
    where: {
      parentId,
      isDeleted: false,
    },
    order: [
      ["displayOrder", "ASC"],
      ["name", "ASC"],
    ],
  });
};

exports.getHomeCategoriesBySectionId = async (sectionId, deviceType = null) => {
  const where = {
    sectionId,
    isDeleted: false,
    isActive: true,
  };

  if (deviceType && deviceType !== "both") {
    where.deviceType = {
      [Op.in]: ["both", deviceType],
    };
  }

  return await HomeCategory.findAll({
    where,
    include: [
      {
        model: HomeCategory,
        as: "parent",
        required: false,
        attributes: ["id", "publicId", "name", "imgUrl"],
      },
      {
        model: require("../category/model"),
        as: "redirectCategory",
        required: false,
        attributes: ["id", "publicId", "name", "slug"],
      },
    ],
    order: [
      ["displayOrder", "ASC"],
      ["name", "ASC"],
    ],
  });
};

exports.getHomeCategoryTree = async () => {
  const CategorySection = require("../categorySection/model");
  const homeCategories = await HomeCategory.findAll({
    where: {
      isDeleted: false,
      isActive: true,
    },
    include: [
      {
        model: CategorySection,
        as: "section",
        required: false,
        attributes: ["id", "name"],
      },
      {
        model: require("../category/model"),
        as: "redirectCategory",
        required: false,
        attributes: ["id", "publicId", "name", "slug"],
      },
    ],
    order: [
      ["displayOrder", "ASC"],
      ["name", "ASC"],
    ],
  });
  return buildHomeCategoryTree(homeCategories, null);
};

exports.getHomeCategoryWithChildren = async (id) => {
  return await HomeCategory.findByPk(id, {
    include: [
      {
        model: HomeCategory,
        as: "children",
        where: { isDeleted: false },
        required: false,
        order: [
          ["displayOrder", "ASC"],
          ["name", "ASC"],
        ],
      },
    ],
  });
};

exports.getHomeCategoryWithParent = async (id) => {
  return await HomeCategory.findByPk(id, {
    include: [
      {
        model: HomeCategory,
        as: "parent",
        where: { isDeleted: false },
        required: false,
      },
    ],
  });
};

exports.getHomeCategoryByPublicId = async (publicId) => {
  return await HomeCategory.findOne({
    where: { publicId, isDeleted: false },
  });
};

exports.getHomeCategoriesForHomePage = async () => {
  return await HomeCategory.findAll({
    where: {
      parentId: null,
      showOnHomePage: true,
      isDeleted: false,
      isActive: false,
    },
    include: [
      {
        model: HomeCategory,
        as: "children",
        required: false,
        separate: true,
        where: {
          isDeleted: false,
          isActive: false,
        },
        attributes: [
          "id",
          "publicId",
          "name",
          "parentId",
          "sectionId",
          "redirectCategoryId",
          "imgUrl",
          "displayOrder",
          "isActive",
          "deviceType",
          "filters",
          "showOnHomePage",
        ],
        order: [
          ["displayOrder", "ASC"],
          ["name", "ASC"],
        ],
        include: [
          {
            model: require("../category/model"),
            as: "redirectCategory",
            required: false,
            attributes: ["id", "publicId", "name", "slug"],
          },
        ],
      },
      {
        model: require("../category/model"),
        as: "redirectCategory",
        required: false,
        attributes: ["id", "publicId", "name", "slug"],
      },
    ],
    order: [
      ["displayOrder", "ASC"],
      ["name", "ASC"],
    ],
  });
};
