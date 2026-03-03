const s3Service = require("../../services/s3");

exports.generateBulkUploadUrls = async (images, userId) => {
  const results = await s3Service.generatePresignedUrlBulk(images, userId);

  return {
    images: results,
    totalImages: images.length,
    successfulImages: results.filter((r) => r.status === "success").length,
    failedImages: results.filter((r) => r.status === "failed").length,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  };
};
