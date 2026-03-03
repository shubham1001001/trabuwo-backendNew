const Redis = require("ioredis");
const config = require("config");
const logger = require("./logger");

const redisUrl = config.get("redis.url");
const redisKeyPrefix = config.get("redis.keyPrefix");

const redis = new Redis(redisUrl, {
  keyPrefix: redisKeyPrefix,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 30000, // Increased from 10000 to 30000
  commandTimeout: 15000, // Increased from 5000 to 15000
  retryDelayOnClusterDown: 300,
  enableOfflineQueue: true,
  maxLoadingTimeout: 30000, // Increased from 10000 to 30000
});

redis.on("connect", () => {
  logger.info("✅ Redis client connected");
});

redis.on("ready", () => {
  logger.info("✅ Redis client ready");
});

redis.on("error", (err) => {
  logger.error("❌ Redis client error:", err);
});

redis.on("close", () => {
  logger.warn("⚠️ Redis client connection closed");
});

redis.on("reconnecting", () => {
  logger.info("🔄 Redis client reconnecting...");
});

redis.on("end", () => {
  logger.warn("⚠️ Redis client connection ended");
});

const healthCheck = async () => {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error("Redis health check failed:", error);
    return false;
  }
};

const closeConnection = async () => {
  try {
    await redis.quit();
    logger.info("Redis connection closed gracefully");
  } catch (error) {
    logger.error("Error closing Redis connection:", error);
  }
};

module.exports = {
  redis,
  healthCheck,
  closeConnection,
};
