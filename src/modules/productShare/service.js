const dao = require("./dao");
const productDao = require("../product/dao");
const { NotFoundError } = require("../../utils/errors");

exports.shareProduct = async (userId, productPublicId) => {
  const product = await productDao.getProductByPublicId(productPublicId);
  if (!product) {
    throw new NotFoundError("Product not found");
  }

  await dao.upsertProductShare(userId, product.id);
  return { success: true };
};

exports.getSharedProducts = async (userId, pagination) => {
  return dao.getSharedProducts(userId, pagination);
};
