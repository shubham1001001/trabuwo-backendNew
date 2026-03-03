const Banner = require("./model");
const { Op } = require("sequelize");

const createBanner = async (bannerData, transaction = null) => {
  return await Banner.create(bannerData, { transaction });
};

const getBannerById = async (id, transaction = null) => {
  return await Banner.findOne({
    where: { id, isDeleted: false },
    transaction,
  });
};

const getAllBanners = async (filters = {}, transaction = null) => {
  const whereClause = { isDeleted: false };

  if (filters.section) {
    whereClause.section = filters.section;
  }

  if (filters.isActive !== undefined) {
    whereClause.isActive = filters.isActive;
  }

  if (filters.currentTime) {
    whereClause.startTime = { [Op.lte]: filters.currentTime };
    whereClause.endTime = { [Op.gte]: filters.currentTime };
  }

  return await Banner.findAll({
    where: whereClause,
    order: [
      ["position", "ASC"],
      ["createdAt", "DESC"],
    ],
    transaction,
  });
};

const getBannersBySection = async (section, transaction = null) => {
  const currentTime = new Date();
  return await Banner.findAll({
    where: {
      section,
      isActive: true,
      isDeleted: false,
      startTime: { [Op.lte]: currentTime },
      endTime: { [Op.gte]: currentTime },
    },
    order: [["position", "ASC"]],
    transaction,
  });
};

const updateBannerById = async (id, updateData, transaction = null) => {
  const [updatedRowsCount] = await Banner.update(updateData, {
    where: { id, isDeleted: false },
    transaction,
  });

  if (updatedRowsCount === 0) {
    return null;
  }

  return await getBannerById(id, transaction);
};

const softDeleteBannerById = async (id, transaction = null) => {
  return await Banner.update(
    { isDeleted: true },
    { where: { id, isDeleted: false }, transaction }
  );
};

const getBannerCount = async (filters = {}, transaction = null) => {
  const whereClause = { isDeleted: false };

  if (filters.section) {
    whereClause.section = filters.section;
  }

  if (filters.isActive !== undefined) {
    whereClause.isActive = filters.isActive;
  }

  return await Banner.count({ where: whereClause, transaction });
};

const getBannersWithPagination = async (
  page = 1,
  limit = 10,
  filters = {},
  transaction = null
) => {
  const offset = (page - 1) * limit;
  const whereClause = { isDeleted: false };

  if (filters.section) {
    whereClause.section = filters.section;
  }

  if (filters.isActive !== undefined) {
    whereClause.isActive = filters.isActive;
  }

  if (filters.currentTime) {
    whereClause.startTime = { [Op.lte]: filters.currentTime };
    whereClause.endTime = { [Op.gte]: filters.currentTime };
  }

  return await Banner.findAndCountAll({
    where: whereClause,
    order: [
      ["position", "ASC"],
      ["createdAt", "DESC"],
    ],
    limit,
    offset,
    transaction,
  });
};

const bulkUpdateBanners = async (updates, transaction = null) => {
  const updatePromises = updates.map(({ id, ...updateData }) =>
    updateBannerById(id, updateData, transaction)
  );

  return await Promise.all(updatePromises);
};

const getActiveBannersCount = async (transaction = null) => {
  const currentTime = new Date();
  return await Banner.count({
    where: {
      isActive: true,
      isDeleted: false,
      startTime: { [Op.lte]: currentTime },
      endTime: { [Op.gte]: currentTime },
    },
    transaction,
  });
};

module.exports = {
  createBanner,
  getBannerById,
  getAllBanners,
  getBannersBySection,
  updateBannerById,
  softDeleteBannerById,
  getBannerCount,
  getBannersWithPagination,
  bulkUpdateBanners,
  getActiveBannersCount,
};
