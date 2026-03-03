const logger = require("../config/logger");
const dao = require("../modules/auth/dao");

async function processRefreshTokenCleanupJob() {
  const startTime = Date.now();

  try {
    logger.info("🔄 Starting refresh token cleanup job processing...");

    const expiredCount = await dao.countExpiredTokens();
    const revokedCount = await dao.countRevokedTokens();

    logger.info(
      `Found ${expiredCount} expired tokens and ${revokedCount} revoked tokens to clean up`
    );

    if (expiredCount === 0 && revokedCount === 0) {
      logger.info("No refresh tokens found to clean up");
      return {
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: "No tokens to clean up",
        expiredDeleted: 0,
        revokedDeleted: 0,
      };
    }

    const expiredResult = await dao.deleteExpiredTokens();
    logger.info(`Deleted ${expiredResult.deletedCount} expired refresh tokens`);

    const revokedResult = await dao.deleteRevokedTokens();
    logger.info(`Deleted ${revokedResult.deletedCount} revoked refresh tokens`);

    const duration = Date.now() - startTime;
    const totalDeleted =
      expiredResult.deletedCount + revokedResult.deletedCount;

    logger.info(
      `Refresh token cleanup job completed successfully in ${duration}ms`
    );
    logger.info(
      `Total tokens deleted: ${totalDeleted} (${expiredResult.deletedCount} expired, ${revokedResult.deletedCount} revoked)`
    );

    return {
      success: true,
      duration,
      timestamp: new Date().toISOString(),
      message: "Refresh token cleanup job completed successfully",
      expiredDeleted: expiredResult.deletedCount,
      revokedDeleted: revokedResult.deletedCount,
      totalDeleted,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      `❌ Refresh token cleanup job failed after ${duration}ms:`,
      error
    );

    throw error;
  }
}

function getJobConfig() {
  return {
    name: "refresh-token-cleanup",
    cron: "0 0 * * *",
    retries: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  };
}

module.exports = {
  processRefreshTokenCleanupJob,
  getJobConfig,
};
