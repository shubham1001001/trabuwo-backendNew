const dao = require("./dao");
const s3Service = require("../../services/s3");
const config = require("config");
const { v4: uuidv4 } = require("uuid");
const {
  convertToWebP,
  sanitizeFileName,
  DEFAULT_QUALITY,
} = require("../../utils/imageProcessor");

exports.getSettings = async () => {
  let settings = await dao.getSettings();
  if (!settings) {
    // Return default if none found
    settings = {
      title: "Gold",
      subtitle: "Products you choose, quality we promise.",
      heroImageUrl: null,
    };
  }
  return settings;
};

exports.updateSettings = async (payload, files = {}) => {
  let existing = await dao.getSettings();
  if (!existing) {
    existing = await dao.createSettings({
      title: "Gold",
      subtitle: "Products you choose, quality we promise.",
    });
  }

  const updateData = { ...payload };

  // Helper for processing and uploading
  const processImage = async (file, folder, oldUrl) => {
    const webpBuffer = await convertToWebP(
      file.buffer,
      DEFAULT_QUALITY,
      file.mimetype
    );
    const key = `gold-section/${folder}/${Date.now()}-${uuidv4()}.webp`;
    await s3Service.uploadBuffer(webpBuffer, key, "image/webp");

    // Delete old
    if (oldUrl) {
      try {
        const oldKey = oldUrl.replace(`${config.get("aws.cloudfront.domain")}/`, "");
        await s3Service.deleteObject(oldKey);
      } catch (err) {}
    }
    return `${config.get("aws.cloudfront.domain")}/${key}`;
  };

  if (files.bgFile) {
    updateData.backgroundImageUrl = await processImage(files.bgFile, "background", existing.backgroundImageUrl);
  }

  if (files.heroFile) {
    updateData.heroImageUrl = await processImage(files.heroFile, "hero", existing.heroImageUrl);
  }

  // Ensure shopNowCategoryId is cast to number or null
  if (updateData.shopNowCategoryId === "" || updateData.shopNowCategoryId === "null") {
    updateData.shopNowCategoryId = null;
  } else if (updateData.shopNowCategoryId) {
    updateData.shopNowCategoryId = parseInt(updateData.shopNowCategoryId);
  }

  await dao.updateSettings(existing.id, updateData);
  return await dao.getSettings();
};

exports.uploadGoldCategoryImage = async (file) => {
    const sharp = require('sharp');
    const processedBuffer = await sharp(file.buffer)
        .webp({ quality: 80 })
        .toBuffer();

    const fileName = `gold-section/tiles/${Date.now()}.webp`;
    const key = await s3Service.uploadBuffer(
        processedBuffer,
        fileName,
        'image/webp'
    );
    return `${config.get("aws.cloudfront.domain")}/${key}`;
};
