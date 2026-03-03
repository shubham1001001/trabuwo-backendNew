const CategorySection = require("./model");
const SectionAsset = require("../sectionAsset/model");
const Category = require("../category/model");
const sequelize = require("../../config/database");
const { Op } = require("sequelize");

const SAFE_FILTER_KEY_PATTERN = /^[a-zA-Z0-9_]+$/;
const FILTER_COLUMN_REF = `"${CategorySection.name}"."filter"`;

exports.createSection = async (data) => {
  return await CategorySection.create(data);
};

exports.getSectionById = async (id) => {
  return await CategorySection.findByPk(id);
};

exports.getSectionByPublicId = async (publicId, { transaction } = {}) => {
  return await CategorySection.findOne({
    where: { publicId, isDeleted: false },
    transaction,
  });
};

exports.updateSectionById = async (id, data, { transaction } = {}) => {
  await CategorySection.update(data, { where: { id }, transaction });
  return await CategorySection.findByPk(id, { transaction });
};

exports.getSectionsWithAssetsByCategoryId = async (
  categoryId,
  deviceType = null,
  filter = null
) => {
  const assetWhere = { enabled: true, isDeleted: false };
  if (deviceType && deviceType !== "both") {
    assetWhere.deviceType = deviceType;
  }

  const whereClause = { categoryId, isActive: true, isDeleted: false };
  if (filter && typeof filter === "object" && !Array.isArray(filter)) {
    const filterConditions = [];
    Object.entries(filter).forEach(([key, value]) => {
      if (!SAFE_FILTER_KEY_PATTERN.test(key) || value === undefined) return;
      const values = Array.isArray(value)
        ? value.filter((v) => v !== undefined && v !== null && v !== "")
        : [value].filter((v) => v !== undefined && v !== null && v !== "");
      if (values.length === 0) return;
      const keyLiteral = key.replace(/'/g, "''");
      const keyPath = `${FILTER_COLUMN_REF} -> '${keyLiteral}'`;
      const arrayLiteral = values
        .map((v) => sequelize.escape(String(v)))
        .join(",");
      const requestArray = `to_jsonb(ARRAY[${arrayLiteral}]::text[])`;
      filterConditions.push(
        sequelize.literal(
          `((${keyPath}) @> ${requestArray} AND (${keyPath}) <@ ${requestArray})`
        )
      );
    });
    if (filterConditions.length > 0) {
      whereClause[Op.and] = [
        ...(whereClause[Op.and] || []),
        ...filterConditions,
      ];
    }
  }

  return await CategorySection.findAll({
    where: whereClause,
    include: [
      {
        model: SectionAsset,
        as: "assets",
        required: false,
        where: assetWhere,
        separate: true,
        order: [["displayOrder", "ASC"]],
        include: [
          {
            model: Category,
            as: "redirectCategory",
            attributes: ["id", "name", "slug"],
          },
        ],
      },
      { model: Category, as: "category", attributes: ["id", "name", "slug"] },
    ],
    order: [["displayOrder", "ASC"]],
  });
};
