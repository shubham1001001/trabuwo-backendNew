const {
  processPriceRecommendationsRefreshJob,
} = require("../jobs/priceRecommendationsRefreshJob");

module.exports = async () => {
  return await processPriceRecommendationsRefreshJob();
};
