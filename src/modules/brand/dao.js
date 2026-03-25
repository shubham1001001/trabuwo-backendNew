const Brand = require("./model");
const sequelize = require("../../config/database");
/**
 * CREATE BRAND
 */
exports.create = (data) => Brand.create(data);

/**
 * FIND BY ID
 */
exports.findById = (id) => Brand.findByPk(id);

/**
 * FIND BY PUBLIC ID
 */
exports.findByPublicId = (publicId, options = {}) =>
  Brand.findOne({
    where: { publicId },
    ...options,
  });

/**
 * FIND BY SLUG
 */
exports.findBySlug = (slug) =>
  Brand.findOne({
    where: { slug },
  });

/**
 * UPDATE BRAND
 */
exports.update = (id, data) =>
  Brand.update(data, {
    where: { id },
    returning: true,
  });

/**
 * DELETE BRAND (SOFT DELETE)
 */
exports.delete = (id) =>
  Brand.update(
    { status: "deleted" },
    {
      where: { id },
      returning: true,
    }
  );

/**
 * LIST BRANDS (basic pagination)
 */
exports.list = ({ limit, offset }) =>
  Brand.findAndCountAll({
    
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

exports.listActiveBrands = ({ limit, offset, status }) =>
  Brand.findAndCountAll({
    where: { status },
    attributes: ["publicId", "name", "slug", "logoUrl", "bannerUrl"], 
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
  