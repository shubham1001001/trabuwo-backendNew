const s3ObjectTrackerDao = require("./dao");

exports.createUnlinkedRecord = async (s3Key, options = {}) => {
  return await s3ObjectTrackerDao.createUnlinkedRecord(s3Key, options);
};

exports.createUnlinkedRecordsBulk = async (s3Keys, options = {}) => {
  return await s3ObjectTrackerDao.createUnlinkedRecordsBulk(s3Keys, options);
};

exports.markAsLinked = async (s3Key, options = {}) => {
  const result = await s3ObjectTrackerDao.markAsLinked(s3Key, options);
  return result;
};

exports.cleanupLinkedRecords = async () => {
  const deletedCount = await s3ObjectTrackerDao.deleteLinkedRecords();
  return { deletedCount };
};

exports.cleanupOldUnlinkedRecords = async (daysOld = 7) => {
  const deletedCount = await s3ObjectTrackerDao.deleteOldUnlinkedRecords(
    daysOld
  );
  return { deletedCount, daysOld };
};

exports.getCleanupStats = async () => {
  const linkedRecords = await s3ObjectTrackerDao.getLinkedRecords();
  const oldUnlinkedRecords = await s3ObjectTrackerDao.getOldUnlinkedRecords(7);

  return {
    linkedCount: linkedRecords.length,
    oldUnlinkedCount: oldUnlinkedRecords.length,
  };
};
