const dao = require("./dao");
const orderDao = require("../order/dao");
const { NotFoundError, ValidationError } = require("../../utils/errors");
const s3Service = require("../../services/s3");
const { Store } = require("../sellerOnboarding/model");

exports.createReview = async (payload, userId) => {
  const { orderItemId, rating, title, text, images } = payload;

  const orderItem = await orderDao.getOrderItemByPublicId(
    orderItemId,
    "shipped"
  );

  if (!orderItem) {
    throw new NotFoundError("Order item not found");
  }

  if (orderItem.order.buyerId !== userId) {
    throw new ValidationError("You can only review items you purchased");
  }

  if (orderItem.order.status !== "shipped") {
    throw new ValidationError(
      "You can only review items after they are shipped"
    );
  }

  const created = await dao.create(
    { orderItemId: orderItem.id, reviewerId: userId, rating, title, text },
    images
  );
  return created;
};

exports.updateReview = async (id, payload, userId) => {
  const current = await dao.getById(id);
  if (!current || current.isDeleted) {
    throw new NotFoundError("Review not found");
  }
  if (current.reviewerId !== userId) {
    throw new ValidationError("You can only update your own review");
  }

  const updates = {};
  if (payload.rating) updates.rating = payload.rating;
  if (payload.title) updates.title = payload.title;
  if (payload.text) updates.text = payload.text;
  const images = payload.images ? payload.images : null;
  return dao.update(id, updates, images);
};

exports.deleteReview = async (id, userId) => {
  const current = await dao.getById(id);
  if (!current || current.isDeleted) {
    throw new NotFoundError("Review not found");
  }
  if (current.reviewerId !== userId) {
    throw new ValidationError("You can only delete your own review");
  }
  await dao.softDelete(id);
};

exports.getProductReviews = async (productId, { page, limit, sort }) => {
  return dao.listByProduct(productId, { page, limit, sort });
};

exports.getMyReviews = async (userId, { page, limit }) => {
  return dao.listByUser(userId, { page, limit });
};

exports.generatePresignedUrl = async (fileName, contentType, userId) => {
  return s3Service.generatePresignedUrl(
    fileName,
    contentType,
    userId,
    "reviews"
  );
};

const incrementHelpful = async (reviewId, userId) => {
  await dao.addHelpfulVote(reviewId, userId);
};

const decrementHelpful = async (reviewId, userId) => {
  await dao.removeHelpfulVote(reviewId, userId);
};

exports.markHelpful = async (reviewId, userId) => {
  await incrementHelpful(reviewId, userId);
};

exports.unmarkHelpful = async (reviewId, userId) => {
  await decrementHelpful(reviewId, userId);
};

exports.getProductsWithMostHelpfulReview = async () => {
  return dao.getProductsWithMostHelpfulReview();
};

exports.getStoreReviews = async (storePublicId, { page, limit }) => {
  const result = await dao.listByStore(storePublicId, { page, limit });

  if (result.rows.length === 0 && result.count === 0) {
    const store = await Store.findOne({
      where: { publicId: storePublicId },
    });
    if (!store) {
      throw new NotFoundError("Store not found");
    }
  }

  const totalPages = Math.ceil(result.count / limit);

  return {
    reviews: result.rows,
    pagination: {
      total: result.count,
      page: result.page,
      limit: result.limit,
      totalPages,
    },
  };
};

exports.getStoreRatingHistogram = async (storePublicId) => {
  const store = await Store.findOne({
    where: { publicId: storePublicId },
  });

  if (!store) {
    throw new NotFoundError("Store not found");
  }

  return dao.getStoreRatingHistogram(storePublicId, { shippedOnly: true });
};
