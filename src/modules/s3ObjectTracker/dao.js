const S3ObjectTracker = require("./model");

exports.createUnlinkedRecord = async (s3Key, options = {}) => {
  if (Array.isArray(s3Key)) {
    return await this.createUnlinkedRecordsBulk(s3Key, options);
  }

  return await S3ObjectTracker.create(
    {
      s3Key,
      status: "unlinked",
    },
    options
  );
};

exports.createUnlinkedRecordsBulk = async (s3Keys, options = {}) => {
  if (!Array.isArray(s3Keys) || s3Keys.length === 0) {
    throw new Error("s3Keys must be a non-empty array");
  }

  const records = s3Keys.map((s3Key) => ({
    s3Key,
    status: "unlinked",
  }));

  return await S3ObjectTracker.bulkCreate(records, options);
};

exports.markAsLinked = async (s3Key, options = {}) => {
  const tracker = await S3ObjectTracker.findOne({
    where: { s3Key },
    ...options,
  });

  if (!tracker) {
    throw new Error("S3ObjectTracker record not found");
  }

  return await tracker.update({ status: "linked" }, options);
};

exports.getLinkedRecords = async () => {
  return await S3ObjectTracker.findAll({
    where: { status: "linked" },
  });
};

exports.getOldUnlinkedRecords = async (daysOld) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await S3ObjectTracker.findAll({
    where: {
      status: "unlinked",
      createdAt: {
        [require("sequelize").Op.lt]: cutoffDate,
      },
    },
  });
};

exports.deleteLinkedRecords = async () => {
  return await S3ObjectTracker.destroy({
    where: { status: "linked" },
  });
};

exports.deleteOldUnlinkedRecords = async (daysOld) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await S3ObjectTracker.destroy({
    where: {
      status: "unlinked",
      createdAt: {
        [require("sequelize").Op.lt]: cutoffDate,
      },
    },
  });
};

exports.getByS3Key = async (s3Key) => {
  return await S3ObjectTracker.findOne({
    where: { s3Key },
  });
};
