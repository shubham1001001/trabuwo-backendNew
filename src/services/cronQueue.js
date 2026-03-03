const { Worker } = require("bullmq");
const { cronQueue, connection } = require("../config/bullmq");
const logger = require("../config/logger");
const { processViewFlushJob, getJobConfig } = require("../jobs/viewFlushJob");
const {
  processRefreshTokenCleanupJob,
  getJobConfig: getRefreshTokenCleanupJobConfig,
} = require("../jobs/refreshTokenCleanupJob");
const {
  processProductViewHistoryCleanupJob,
  getJobConfig: getProductViewHistoryCleanupJobConfig,
} = require("../jobs/productViewHistoryCleanupJob");
const {
  processPriceRecommendationsRefreshJob,
  getJobConfig: getPriceRecommendationsRefreshJobConfig,
} = require("../jobs/priceRecommendationsRefreshJob");

class CronQueueService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.worker = new Worker(
        "cron-jobs",
        async (job) => {
          logger.info(`Processing job: ${job.name} with ID: ${job.id}`);

          switch (job.name) {
            case "view-flush":
              return await processViewFlushJob(job.data);
            case "refresh-token-cleanup":
              return await processRefreshTokenCleanupJob(job.data);
            case "product-view-history-cleanup":
              return await processProductViewHistoryCleanupJob(job.data);
            case "price-recommendations-refresh":
              return await processPriceRecommendationsRefreshJob(job.data);
            default:
              throw new Error(`Unknown job type: ${job.name}`);
          }
        },
        {
          connection,
          concurrency: 1,
          removeOnComplete: 10,
          removeOnFail: 5,
        }
      );

      this.worker.on("completed", (job) => {
        logger.info(`Job ${job.id} completed successfully`);
      });

      this.worker.on("failed", (job, err) => {
        logger.error(`Job ${job.id} failed:`, err);
      });

      this.worker.on("error", (err) => {
        logger.error("Worker error:", err);
      });

      this.isInitialized = true;
      logger.info("Cron queue service initialized");
    } catch (error) {
      logger.error("Failed to initialize cron queue service:", error);
      throw error;
    }
  }

  async scheduleViewFlushJob() {
    try {
      const jobConfig = getJobConfig();

      await cronQueue.add(
        "view-flush",
        {},
        {
          repeat: {
            pattern: jobConfig.cron,
          },
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: jobConfig.retries,
          backoff: jobConfig.backoff,
        }
      );

      logger.info(`View flush job scheduled with pattern: ${jobConfig.cron}`);
    } catch (error) {
      logger.error("Failed to schedule view flush job:", error);
      throw error;
    }
  }

  async scheduleRefreshTokenCleanupJob() {
    try {
      const jobConfig = getRefreshTokenCleanupJobConfig();

      await cronQueue.add(
        "refresh-token-cleanup",
        {},
        {
          repeat: {
            pattern: jobConfig.cron,
          },
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: jobConfig.retries,
          backoff: jobConfig.backoff,
        }
      );

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

      await cronQueue.add(
        "product-view-history-cleanup",
        {},
        {
          repeat: {
            pattern: jobConfig.cron,
          },
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: jobConfig.retries,
          backoff: jobConfig.backoff,
        }
      );

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

      await cronQueue.add(
        "price-recommendations-refresh",
        {},
        {
          repeat: {
            pattern: jobConfig.cron,
          },
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: jobConfig.retries,
          backoff: jobConfig.backoff,
        }
      );

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

  async getQueueStatus() {
    try {
      const waiting = await cronQueue.getWaiting();
      const active = await cronQueue.getActive();
      const completed = await cronQueue.getCompleted();
      const failed = await cronQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      logger.error("Error getting queue status:", error);
      return null;
    }
  }

  async close() {
    try {
      if (this.worker) {
        await this.worker.close();
        this.worker = null;
      }
      this.isInitialized = false;
      logger.info("Cron queue service closed");
    } catch (error) {
      logger.error("Error closing cron queue service:", error);
    }
  }
}

module.exports = new CronQueueService();
