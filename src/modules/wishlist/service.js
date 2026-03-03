const dao = require("./dao");
const productDao = require("../product/dao");
const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../../utils/errors");

exports.getWishlist = async (userId) => {
  const wishlistItems = await dao.findWishlistItemsByUserId(userId);

  if (!wishlistItems || wishlistItems.length === 0) {
    return [];
  }

  return wishlistItems.map((item) => item.toJSON());
};

exports.addToWishlist = async (userId, productPublicId) => {
  const product = await productDao.getProductByPublicId(productPublicId);

  if (!product) {
    throw new NotFoundError(`Product with ID ${productPublicId} not found`);
  }

  if (product.isDeleted) {
    throw new ValidationError("Product is not available");
  }

  const existingItem = await dao.findWishlistItemByUserAndProduct(
    userId,
    product.id
  );

  if (existingItem) {
    throw new ConflictError("Product is already in wishlist");
  }

  const wishlistItem = await dao.addToWishlist(userId, product.id);

  const addedItem = await dao.findWishlistItemByIdWithProduct(wishlistItem.id);

  return addedItem;
};

exports.removeFromWishlist = async (userId, productPublicId) => {
  const product = await productDao.getProductByPublicId(productPublicId);

  if (!product) {
    throw new NotFoundError(`Product with ID ${productPublicId} not found`);
  }

  const deleted = await dao.removeFromWishlistByUserAndProduct(
    userId,
    product.id
  );

  if (deleted === 0) {
    throw new NotFoundError("Product is not in your wishlist");
  }

  return { message: "Product removed from wishlist successfully" };
};
