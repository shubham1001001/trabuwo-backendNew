const logger = require("../config/logger");
const sequelize = require("../config/database");

async function processPriceRecommendationsRefreshJob() {
  const startTime = Date.now();
  logger.info(
    "🔄 Refreshing materialized view: price_recommendations_mv (concurrently)..."
  );

  await sequelize.query(
    "REFRESH MATERIALIZED VIEW CONCURRENTLY price_recommendations_mv;"
  );

  const duration = Date.now() - startTime;
  logger.info(`✅ price_recommendations_mv refreshed in ${duration}ms`);
  return { success: true, duration };
}

function getJobConfig() {
  return {
    name: "price-recommendations-refresh",
    cron: "0 2 * * *", // 02:00 daily
    retries: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  };
}

module.exports = {
  processPriceRecommendationsRefreshJob,
  getJobConfig,
};
