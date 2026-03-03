const dao = require("./dao");
const productDao = require("../product/dao");
const { NotFoundError } = require("../../utils/errors");

exports.trackProductView = async (userId, productPublicId) => {
  const product = await productDao.getProductByPublicId(productPublicId);

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  await dao.upsertProductViewHistory(userId, product.id);

  return { success: true };
};

exports.getUserViewHistory = async (userId, pagination) => {
  const result = await dao.getUserViewHistory(userId, pagination);
  return result;
};
