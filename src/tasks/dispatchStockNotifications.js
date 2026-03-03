const logger = require("../config/logger");
const notificationDao = require("../modules/productStockNotification/dao");
const { ProductVariant } = require("../modules/product/model");
const sequelize = require("../config/database");

module.exports = async (payload, { job }) => {
  const { productVariantId } = payload;

  logger.info(
    `Dispatching stock notifications for variant ${productVariantId} (job ${job.id})`,
  );

  const variant = await ProductVariant.findByPk(productVariantId, {
    include: [
      {
        model: require("../modules/product/model").Product,
        as: "product",
      },
    ],
  });

  if (!variant || variant.isDeleted || variant.inventory === 0) {
    logger.info(
      `Variant ${productVariantId} is not eligible for notifications (deleted or out of stock).`,
    );
    return { skipped: true };
  }

  // Batch through all active, not-yet-notified subscriptions for this variant
  const BATCH_SIZE = 100;
  let offset = 0;
  let processed = 0;

  // We deliberately keep this simple; if the number of subscribers grows very large,
  // this can be optimized further with keyset pagination.
  // For reliability, we rely on Graphile Worker's at-least-once semantics and
  // only process isNotified=false records.
  // Basic offset-based pagination loop
  // We break explicitly when no more notifications are found.
  // eslint rules: allow this loop as we're breaking on an explicit condition.
  // noinspection InfiniteLoopJS
  while (true) {
    const notifications =
      await notificationDao.findPendingNotificationsByVariant(
        productVariantId,
        BATCH_SIZE,
        offset,
      );

    if (!notifications || notifications.length === 0) {
      break;
    }

    for (const notification of notifications) {
      // Create an individual job for each email so it can be retried independently.
      // Use Graphile Worker's add_job SQL helper directly to avoid JS helper/circular issues.
      await sequelize.query(
        `
          SELECT graphile_worker.add_job(
            $1::text,         -- task_identifier
            $2::json,         -- payload
            job_key := $3     -- per-email de-duplication
          );
        `,
        {
          bind: [
            "send-stock-notification",
            JSON.stringify({
              notificationId: notification.publicId,
              userId: notification.userId,
              productVariantId,
            }),
            `send-stock-notification-${notification.id}`,
          ],
        },
      );

      processed += 1;
    }

    // Move to next batch
    offset += notifications.length;
  }

  logger.info(
    `Dispatch job ${job.id} for variant ${productVariantId} completed, processed ${processed} notifications.`,
  );

  return {
    success: true,
    productVariantId,
    processed,
  };
};
