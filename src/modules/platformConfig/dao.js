const { PlatformConfig, CategoryCommission } = require("./model");
const { Op } = require("sequelize");

// ──────── Platform Config ────────

exports.getConfigByKey = async (key, options = {}) => {
  return await PlatformConfig.findOne({
    where: { key, isActive: true },
    ...options,
  });
};

exports.getAllConfigs = async (category, options = {}) => {
  const where = { isActive: true };
  if (category) {
    where.category = category;
  }
  return await PlatformConfig.findAll({
    where,
    order: [["category", "ASC"], ["key", "ASC"]],
    ...options,
  });
};

exports.upsertConfig = async (key, data, options = {}) => {
  const existing = await PlatformConfig.findOne({
    where: { key },
    ...options,
  });

  if (existing) {
    return await existing.update(data, options);
  }

  return await PlatformConfig.create({ key, ...data }, options);
};

exports.bulkUpsertConfigs = async (configs, options = {}) => {
  const results = [];
  for (const config of configs) {
    const result = await exports.upsertConfig(config.key, config, options);
    results.push(result);
  }
  return results;
};

// ──────── Category Commission ────────

exports.getCategoryCommission = async (categoryId, options = {}) => {
  return await CategoryCommission.findOne({
    where: { categoryId, isActive: true },
    ...options,
  });
};

exports.getAllCategoryCommissions = async (options = {}) => {
  return await CategoryCommission.findAll({
    where: { isActive: true },
    order: [["categoryId", "ASC"]],
    ...options,
  });
};

exports.upsertCategoryCommission = async (categoryId, commissionRate, options = {}) => {
  const existing = await CategoryCommission.findOne({
    where: { categoryId },
    ...options,
  });

  if (existing) {
    return await existing.update({ commissionRate, isActive: true }, options);
  }

  return await CategoryCommission.create(
    { categoryId, commissionRate },
    options
  );
};

exports.deleteCategoryCommission = async (categoryId, options = {}) => {
  return await CategoryCommission.update(
    { isActive: false },
    { where: { categoryId }, ...options }
  );
};
