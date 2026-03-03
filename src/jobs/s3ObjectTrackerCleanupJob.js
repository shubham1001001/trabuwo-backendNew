const s3ObjectTrackerCleanupJob = require("../modules/s3ObjectTracker/cleanupJob");
const logger = require("../config/logger");

const runS3ObjectTrackerCleanup = async () => {
  try {
    logger.info("Starting scheduled S3ObjectTracker cleanup job");

    const result =
      await s3ObjectTrackerCleanupJob.cleanupS3ObjectTrackerRecords();

    logger.info(
      "Scheduled S3ObjectTracker cleanup job completed successfully",
      {
        linkedDeleted: result.linkedDeleted,
        unlinkedDeleted: result.unlinkedDeleted,
      }
    );

    return result;
  } catch (error) {
    logger.error("Scheduled S3ObjectTracker cleanup job failed:", error);
    throw error;
  }
};

module.exports = {
  runS3ObjectTrackerCleanup,
};
