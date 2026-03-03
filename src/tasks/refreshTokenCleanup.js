const {
  processRefreshTokenCleanupJob,
} = require("../jobs/refreshTokenCleanupJob");

module.exports = async () => {
  return await processRefreshTokenCleanupJob();
};
