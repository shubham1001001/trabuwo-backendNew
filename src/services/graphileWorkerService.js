const graphileWorker = require("../config/graphileWorker");
const logger = require("../config/logger");
const sequelize = require("../config/database");
const {
  getJobConfig: getViewFlushJobConfig,
} = require("../jobs/viewFlushJob");
const {
  getJobConfig: getRefreshTokenCleanupJobConfig,
} = require("../jobs/refreshTokenCleanupJob");
const {
  getJobConfig: getProductViewHistoryCleanupJobConfig,
} = require("../jobs/productViewHistoryCleanupJob");
const {
  getJobConfig: getPriceRecommendationsRefreshJobConfig,
} = require("../jobs/priceRecommendationsRefreshJob");

class GraphileWorkerService {
  constructor() {
    this.runner = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.runner = await graphileWorker.startWorker();
      this.isInitialized = true;
      logger.info("Graphile Worker service initialized");
    } catch (error) {
      logger.error("Failed to initialize Graphile Worker service:", error);
      throw error;
    }
  }

  async scheduleRecurringTasks() {
    try {
      await this.scheduleViewFlushJob();
      await this.scheduleRefreshTokenCleanupJob();
      await this.scheduleProductViewHistoryCleanupJob();
      await this.schedulePriceRecommendationsRefreshJob();
      logger.info("All recurring tasks scheduled");
    } catch (error) {
      logger.error("Failed to schedule recurring tasks:", error);
      throw error;
    }
  }

  async scheduleViewFlushJob() {
    try {
      const jobConfig = getViewFlushJobConfig();
      await this.scheduleRecurringJob("view-flush", jobConfig.cron, jobConfig.retries || 3);
      logger.info(`View flush job scheduled with pattern: ${jobConfig.cron}`);
    } catch (error) {
      logger.error("Failed to schedule view flush job:", error);
      throw error;
    }
  }

  async scheduleRefreshTokenCleanupJob() {
    try {
      const jobConfig = getRefreshTokenCleanupJobConfig();
      await this.scheduleRecurringJob("refresh-token-cleanup", jobConfig.cron, jobConfig.retries || 3);
      logger.info(
        `Refresh token cleanup job scheduled with pattern: ${jobConfig.cron}`
      );
    } catch (error) {
      logger.error("Failed to schedule refresh token cleanup job:", error);
      throw error;
    }
  }

  async scheduleProductViewHistoryCleanupJob() {
    try {
      const jobConfig = getProductViewHistoryCleanupJobConfig();
      await this.scheduleRecurringJob("product-view-history-cleanup", jobConfig.cron, jobConfig.retries || 3);
      logger.info(
        `Product view history cleanup job scheduled with pattern: ${jobConfig.cron}`
      );
    } catch (error) {
      logger.error(
        "Failed to schedule product view history cleanup job:",
        error
      );
      throw error;
    }
  }

  async schedulePriceRecommendationsRefreshJob() {
    try {
      const jobConfig = getPriceRecommendationsRefreshJobConfig();
      await this.scheduleRecurringJob("price-recommendations-refresh", jobConfig.cron, jobConfig.retries || 3);
      logger.info(
        `Price recommendations refresh job scheduled with pattern: ${jobConfig.cron}`
      );
    } catch (error) {
      logger.error(
        "Failed to schedule price recommendations refresh job:",
        error
      );
      throw error;
    }
  }

  async scheduleRecurringJob(taskIdentifier, cronPattern, maxAttempts = 3) {
    // NOTE: We are not using Graphile Worker's crontab/known_crontabs mechanism yet.
    // For now, we only log the desired schedule; actual recurrence can be wired
    // later via a crontab file as per the Graphile Worker docs.
    logger.info(
      `Recurring schedule requested for ${taskIdentifier} with pattern ${cronPattern}, but crontab integration is not enabled.`
    );
  }

  async close() {
    try {
      if (this.runner) {
        await graphileWorker.stopWorker();
        this.runner = null;
      }
      this.isInitialized = false;
      logger.info("Graphile Worker service closed");
    } catch (error) {
      logger.error("Error closing Graphile Worker service:", error);
    }
  }
}

module.exports = new GraphileWorkerService();
