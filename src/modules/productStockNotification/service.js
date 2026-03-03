const dao = require("./dao");
const { ProductVariant } = require("../product/model");
const { NotFoundError, ConflictError, ValidationError } = require("../../utils/errors");

exports.getNotifications = async (userId) => {
  const notifications = await dao.findNotificationsByUserId(userId);

  if (!notifications || notifications.length === 0) {
    return [];
  }

  return notifications.map((notification) => notification.toJSON());
};

exports.subscribeToVariant = async (userId, productVariantPublicId) => {
  const variant = await ProductVariant.findOne({
    where: { publicId: productVariantPublicId, isDeleted: false },
    include: [
      {
        model: require("../product/model").Product,
        as: "product",
        where: { isDeleted: false },
      },
    ],
  });

  if (!variant) {
    throw new NotFoundError(
      `Product variant with ID ${productVariantPublicId} not found`
    );
  }

  if (variant.inventory > 0) {
    throw new ValidationError("Product variant is already in stock");
  }

  const existingNotification = await dao.findNotificationByUserAndVariant(
    userId,
    variant.id
  );

  if (existingNotification) {
    if (!existingNotification.isActive) {
      await existingNotification.update({ isActive: true, isNotified: false });
      return await dao.findNotificationByPublicId(
        existingNotification.publicId,
        userId
      );
    }
    throw new ConflictError("You are already subscribed to this product variant");
  }

  const notification = await dao.createNotification({
    userId,
    productVariantId: variant.id,
  });

  const createdNotification = await dao.findNotificationByPublicId(
    notification.publicId,
    userId
  );

  return createdNotification;
};

exports.unsubscribeFromVariant = async (userId, notificationPublicId) => {
  const notification = await dao.findNotificationByPublicId(
    notificationPublicId,
    userId
  );

  if (!notification) {
    throw new NotFoundError("Notification subscription not found");
  }

  await dao.deactivateNotification(notification.id);

  return { message: "Unsubscribed from stock notification successfully" };
};
