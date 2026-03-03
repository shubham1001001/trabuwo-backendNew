const { run, quickAddJob } = require("graphile-worker");
const { Pool } = require("pg");
const config = require("config");
const logger = require("./logger");

const dbConfig = config.get("db");
const graphileConfig = config.get("graphileWorker") || {};

const connectionString = `postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`;

// Dedicated pg pool for Graphile Worker with SSL, matching Sequelize's DB settings
const pgPool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.name,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

let runner = null;

const taskList = {
  "send-stock-notification": require("../tasks/sendStockNotification"),
  "dispatch-stock-notifications": require("../tasks/dispatchStockNotifications"),
  "view-flush": require("../tasks/viewFlush"),
  "refresh-token-cleanup": require("../tasks/refreshTokenCleanup"),
  "product-view-history-cleanup": require("../tasks/productViewHistoryCleanup"),
  "price-recommendations-refresh": require("../tasks/priceRecommendationsRefresh"),
};

async function startWorker() {
  if (runner) {
    logger.warn("Graphile Worker is already running");
    return runner;
  }

  try {
    runner = await run({
      pgPool,
      concurrency: graphileConfig.concurrency || 5,
      schema: graphileConfig.schema || "graphile_worker",
      taskList,
    });

    logger.info("✅ Graphile Worker started successfully");
    return runner;
  } catch (error) {
    logger.error("❌ Failed to start Graphile Worker:", error);
    throw error;
  }
}

async function stopWorker() {
  if (runner) {
    await runner.stop();
    runner = null;
    logger.info("Graphile Worker stopped");
  }
}

async function addJob(taskIdentifier, payload, options = {}) {
  try {
    const job = await quickAddJob(
      {
        pgPool,
        schema: graphileConfig.schema || "graphile_worker",
      },
      taskIdentifier,
      payload,
      options,
    );
    logger.info(`Job ${job.id} added for task ${taskIdentifier}`);
    return job;
  } catch (error) {
    logger.error(`Failed to add job for task ${taskIdentifier}:`, error);
    throw error;
  }
}

module.exports = {
  startWorker,
  stopWorker,
  addJob,
  connectionString,
  pgPool,
  schema: graphileConfig.schema || "graphile_worker",
};
