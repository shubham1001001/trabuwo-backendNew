const logger = require("../config/logger");
const dao = require("../modules/productViewHistory/dao");

async function processProductViewHistoryCleanupJob() {
  const startTime = Date.now();

  try {
    logger.info("🔄 Starting product view history cleanup job processing...");

    const count = await dao.countOldViewHistory(7);
    logger.info(`Found ${count} product view history records older than 7 days to clean up`);

    if (count === 0) {
      logger.info("No product view history records found to clean up");
      return {
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: "No records to clean up",
        deletedCount: 0,
      };
    }

    const result = await dao.deleteOldViewHistory(7);
    logger.info(`Deleted ${result.deletedCount} product view history records`);

    const duration = Date.now() - startTime;
    logger.info(
      `Product view history cleanup job completed successfully in ${duration}ms`
    );
    logger.info(`Total records deleted: ${result.deletedCount}`);

    return {
      success: true,
      duration,
      timestamp: new Date().toISOString(),
      message: "Product view history cleanup job completed successfully",
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      `❌ Product view history cleanup job failed after ${duration}ms:`,
      error
    );

    throw error;
  }
}

function getJobConfig() {
  return {
    name: "product-view-history-cleanup",
    cron: "0 2 * * *",
    retries: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  };
}

module.exports = {
  processProductViewHistoryCleanupJob,
  getJobConfig,
};

