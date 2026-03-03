const logger = require("../config/logger");
const service = require("../modules/pricing/service");
const dao = require("../modules/pricing/dao");

async function processViewFlushJob() {
  const startTime = Date.now();

  try {
    logger.info("🔄 Starting view flush job processing...");

    const viewData = await service.getAllProductViews();

    if (viewData.length === 0) {
      logger.info("No product views found in Redis to flush");
      return {
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: "No views to flush",
        flushedCount: 0,
      };
    }

    logger.info(`Found ${viewData.length} product view records to flush`);
    await dao.upsertProductViews(viewData);
    const clearedCount = await service.clearProductViews();
    const duration = Date.now() - startTime;
    logger.info(`View flush job completed successfully in ${duration}ms`);
    logger.info(
      `Flushed ${viewData.length} view records, cleared ${clearedCount} Redis keys`
    );

    return {
      success: true,
      duration,
      timestamp: new Date().toISOString(),
      message: "View flush job completed successfully",
      flushedCount: viewData.length,
      clearedCount,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ View flush job failed after ${duration}ms:`, error);

    throw error;
  }
}

function getJobConfig() {
  return {
    name: "view-flush",
    cron: "0 0 * * *",
    retries: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  };
}

module.exports = {
  processViewFlushJob,
  getJobConfig,
};
