const s3ObjectTrackerService = require("./service");
const logger = require("../../config/logger");

exports.cleanupS3ObjectTrackerRecords = async () => {
  try {
    logger.info("Starting S3ObjectTracker cleanup job");

    const statsBefore = await s3ObjectTrackerService.getCleanupStats();
    logger.info(`Cleanup stats before: ${JSON.stringify(statsBefore)}`);

    const linkedCleanup = await s3ObjectTrackerService.cleanupLinkedRecords();
    logger.info(`Cleaned up ${linkedCleanup.deletedCount} linked records`);

    const unlinkedCleanup =
      await s3ObjectTrackerService.cleanupOldUnlinkedRecords(7);
    logger.info(
      `Cleaned up ${unlinkedCleanup.deletedCount} old unlinked records (older than ${unlinkedCleanup.daysOld} days)`
    );

    const statsAfter = await s3ObjectTrackerService.getCleanupStats();
    logger.info(`Cleanup stats after: ${JSON.stringify(statsAfter)}`);

    logger.info("S3ObjectTracker cleanup job completed successfully");

    return {
      linkedDeleted: linkedCleanup.deletedCount,
      unlinkedDeleted: unlinkedCleanup.deletedCount,
      statsBefore,
      statsAfter,
    };
  } catch (error) {
    logger.error("S3ObjectTracker cleanup job failed:", error);
    throw error;
  }
};

exports.manualCleanup = async (daysOld = 7) => {
  try {
    logger.info(
      `Starting manual S3ObjectTracker cleanup (daysOld: ${daysOld})`
    );

    const linkedCleanup = await s3ObjectTrackerService.cleanupLinkedRecords();
    const unlinkedCleanup =
      await s3ObjectTrackerService.cleanupOldUnlinkedRecords(daysOld);

    logger.info(
      `Manual cleanup completed: ${linkedCleanup.deletedCount} linked, ${unlinkedCleanup.deletedCount} unlinked records deleted`
    );

    return {
      linkedDeleted: linkedCleanup.deletedCount,
      unlinkedDeleted: unlinkedCleanup.deletedCount,
    };
  } catch (error) {
    logger.error("Manual S3ObjectTracker cleanup failed:", error);
    throw error;
  }
};
