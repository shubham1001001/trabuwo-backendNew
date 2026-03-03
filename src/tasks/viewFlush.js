const { processViewFlushJob } = require("../jobs/viewFlushJob");

module.exports = async (payload, { job }) => {
  return await processViewFlushJob();
};
