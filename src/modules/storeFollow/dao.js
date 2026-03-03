const { StoreFollow } = require("./model");
const { User } = require("../auth/model");
const { Store, SellerOnboarding } = require("../sellerOnboarding/model");
const Catalogue = require("../catalogue/model");
const sequelize = require("../../config/database");
const { QueryTypes } = require("sequelize");

exports.createStoreFollow = (data, options = {}) =>
  StoreFollow.create(data, options);

exports.deleteStoreFollow = (userId, storeId, options = {}) =>
  StoreFollow.destroy({
    where: { userId, storeId },
    ...options,
  });

exports.getStoreFollow = (userId, storeId, options = {}) =>
  StoreFollow.findOne({
    where: { userId, storeId },
    ...options,
  });

exports.getUserFollowedStores = (userId, options = {}) =>
  StoreFollow.findAll({
    where: { userId },
    attributes: [],
    include: [
      {
        model: Store,
        as: "store",
        attributes: ["publicId", "name"],
      },
    ],
    ...options,
  });

exports.getStoreFollowers = (storeId, options = {}) =>
  StoreFollow.findAll({
    where: { storeId },
    attributes: [],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["publicId"],
      },
    ],
    ...options,
  });

exports.getStoreFollowersCount = (storeId, options = {}) =>
  StoreFollow.count({
    where: { storeId },
    ...options,
  });

exports.getUserFollowsCount = (userId, options = {}) =>
  StoreFollow.count({
    where: { userId },
    ...options,
  });

exports.checkUserFollowsStore = (userId, storeId, options = {}) =>
  StoreFollow.findOne({
    where: { userId, storeId },
    attributes: ["publicId"],
    ...options,
  });

exports.findStoreByPublicId = (publicId, options = {}) =>
  Store.findOne({
    where: { publicId },
    ...options,
  });

exports.getSellerStatsBySellerPublicId = async (sellerPublicId) => {
  const seller = await User.findOne({
    where: { publicId: sellerPublicId },
    include: [
      {
        model: SellerOnboarding,
        as: "sellerOnboarding",
        required: false,
        include: [
          {
            model: Store,
            as: "store",
            required: false,
            attributes: ["id", "publicId", "name"],
          },
        ],
      },
    ],
    attributes: ["id"],
  });

  if (!seller) {
    return null;
  }

  const cataloguesCount = await Catalogue.count({
    where: { userId: seller.id, isDeleted: false },
  });

  let followersCount = 0;
  const storeId =
    seller.sellerOnboarding &&
    seller.sellerOnboarding.store &&
    seller.sellerOnboarding.store.id;

  if (storeId) {
    followersCount = await StoreFollow.count({
      where: { storeId },
    });
  }

  const sql = `
    SELECT 
      COALESCE(AVG(r.rating), 0) AS "averageRating",
      COUNT(*)::BIGINT AS "ratingCount"
    FROM catalogues c
    JOIN products p ON p.catalogue_id = c.id AND p.is_deleted = false
    JOIN product_variants pv ON pv.product_id = p.id AND pv.is_deleted = false
    JOIN order_items oi ON oi.product_variant_id = pv.id
    JOIN orders o ON o.id = oi.order_id AND o.status = 'shipped'
    JOIN reviews r ON r.order_item_id = oi.id AND r.is_deleted = false
    WHERE c.user_id = :userId
    AND c.is_deleted = false
  `;

  const ratingResult = await sequelize.query(sql, {
    replacements: { userId: seller.id },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const result = ratingResult[0] || { averageRating: 0, ratingCount: 0 };

  return {
    averageRating: parseFloat(result.averageRating) || 0,
    ratingCount: parseInt(result.ratingCount) || 0,
    cataloguesCount: cataloguesCount || 0,
    followersCount: followersCount || 0,
    storeName: seller.sellerOnboarding?.store[0]?.name || "",
  };
};
