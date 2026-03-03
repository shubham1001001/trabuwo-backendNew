const logger = require("../config/logger");
const notificationDao = require("../modules/productStockNotification/dao");
const authDao = require("../modules/auth/dao");
const { sendEmail } = require("../utils/emailService");
const ProductStockNotification = require("../modules/productStockNotification/model");

module.exports = async (payload, { job }) => {
  const { notificationId, userId, productVariantId } = payload;

  try {
    logger.info(
      `Processing stock notification job ${job.id} for notification ${notificationId}`,
    );

    const notification = await ProductStockNotification.findOne({
      where: { publicId: notificationId, userId, isActive: true },
    });

    if (!notification || !notification.isActive) {
      logger.warn(
        `Notification ${notificationId} not found or inactive, skipping`,
      );
      return { skipped: true, reason: "Notification not found or inactive" };
    }

    if (notification.isNotified) {
      logger.warn(`Notification ${notificationId} already sent, skipping`);
      return { skipped: true, reason: "Already notified" };
    }

    const user = await authDao.findUserById(userId);
    if (!user) {
      logger.warn(`User ${userId} not found, skipping notification`);
      return { skipped: true, reason: "User not found" };
    }

    const emailChannel = await authDao.findNotificationChannelByUserIdAndType(
      userId,
      "email",
    );

    if (!emailChannel || !emailChannel.subscribed) {
      logger.warn(
        `User ${userId} does not have active email subscription, skipping`,
      );
      return { skipped: true, reason: "No email subscription" };
    }

    const variant =
      await require("../modules/product/model").ProductVariant.findByPk(
        productVariantId,
        {
          include: [
            {
              model: require("../modules/product/model").Product,
              as: "product",
              include: [
                {
                  model: require("../modules/catalogue/model"),
                  as: "catalogue",
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
      );

    if (!variant || variant.isDeleted) {
      logger.warn(`Variant ${productVariantId} not found or deleted, skipping`);
      return { skipped: true, reason: "Variant not found" };
    }

    if (variant.inventory === 0) {
      logger.warn(
        `Variant ${productVariantId} is still out of stock, skipping notification`,
      );
      return { skipped: true, reason: "Still out of stock" };
    }

    const product = variant.product;
    const productName = product.name;
    const variantPrice = variant.trabuwoPrice;
    const inventory = variant.inventory;

    const subject = `${productName} is back in stock!`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Product Back in Stock</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Great News! ${productName} is Back in Stock</h2>
          <p>Hello,</p>
          <p>We're excited to let you know that <strong>${productName}</strong> is now back in stock!</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Price:</strong> ₹${variantPrice}</p>
            <p style="margin: 5px 0;"><strong>Available Quantity:</strong> ${inventory}</p>
          </div>
          <p>Don't miss out - <a href="https://trabuwo.com/products/${product.publicId}" style="color: #007bff; text-decoration: none;">View Product</a></p>
          <p>Best regards,<br>The Trabuwo Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `Great News! ${productName} is Back in Stock\n\nHello,\n\nWe're excited to let you know that ${productName} is now back in stock!\n\nPrice: ₹${variantPrice}\nAvailable Quantity: ${inventory}\n\nDon't miss out - visit our website to view the product.\n\nBest regards,\nThe Trabuwo Team`;

    await sendEmail({
      to: emailChannel.value,
      subject,
      html,
      text,
    });

    await notificationDao.markAsNotified(notification.id);

    logger.info(
      `Stock notification sent successfully for notification ${notificationId}`,
    );

    return {
      success: true,
      notificationId,
      emailSent: true,
    };
  } catch (error) {
    logger.error(
      `Failed to send stock notification for ${notificationId}:`,
      error,
    );
    throw error;
  }
};
