const { Queue } = require("bullmq");
const config = require("config");
const logger = require("./logger");

const connection = {
  url: config.get("bullmq.connection.url"),
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableOfflineQueue: true,
};

const cronQueue = new Queue("cron-jobs", { connection });

cronQueue.on("error", (error) => {
  logger.error("Cron queue error:", error);
});

cronQueue.on("waiting", (job) => {
  logger.info(`Job ${job.id} waiting to be processed`);
});

cronQueue.on("active", (job) => {
  logger.info(`Job ${job.id} has started processing`);
});

cronQueue.on("completed", (job) => {
  logger.info(`Job ${job.id} has completed successfully`);
});

cronQueue.on("failed", (job, err) => {
  logger.error(`Job ${job.id} has failed:`, err);
});

const closeQueues = async () => {
  try {
    await cronQueue.close();
    logger.info("✅ BullMQ queues closed gracefully");
  } catch (error) {
    logger.error("❌ Error closing BullMQ queues:", error);
  }
};

module.exports = {
  cronQueue,
  connection,
  closeQueues,
};
