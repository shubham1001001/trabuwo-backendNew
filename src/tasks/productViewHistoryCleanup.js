const {
  processProductViewHistoryCleanupJob,
} = require("../jobs/productViewHistoryCleanupJob");

module.exports = async () => {
  return await processProductViewHistoryCleanupJob();
};
