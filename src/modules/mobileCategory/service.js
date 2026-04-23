const dao = require("./dao");
const { NotFoundError, ValidationError } = require("../../utils/errors");
const { v7: uuidv7 } = require("uuid");
const s3Service = require("../../services/s3Service");
const { convertToWebP } = require("../../utils/imageProcessor");
const { sanitizeFileName } = require("../../utils/fileHelper");
const logger = require("../../config/logger");

const DEFAULT_QUALITY = 80;

exports.createCategory = async (data, imageBuffer = null, imageName = null, mimeType = null) => {
  if (!data.name) throw new ValidationError("Category name is required");
  
  if (!data.slug) {
    data.slug = data.name.toLowerCase().replace(/ /g, "-") + "-" + Date.now();
  }

  const created = await dao.createCategory(data);

  if (imageBuffer && mimeType) {
    try {
      const webpBuffer = await convertToWebP(imageBuffer, DEFAULT_QUALITY, mimeType, 256, 256);
      const sanitizedName = sanitizeFileName(imageName);
      const key = `mobile-category-images/${created.id}/${sanitizedName}-${uuidv7()}.webp`;
      await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
      const imageUrl = s3Service.getFileUrl(key);
      await dao.updateCategoryById(created.id, { imageUrl });
      created.imageUrl = imageUrl;
    } catch (err) {
      logger.error("Failed to upload mobile category image", { categoryId: created.id, error: err });
    }
  }

  return created;
};

exports.getAllCategories = async (filters = {}) => {
  return await dao.getAllCategories(filters);
};

exports.getCategoryByPublicId = async (publicId) => {
  const category = await dao.getCategoryByPublicId(publicId);
  if (!category) throw new NotFoundError("Mobile Category not found");
  return category;
};

exports.updateCategoryByPublicId = async (publicId, data, imageBuffer = null, imageName = null, mimeType = null) => {
  const category = await dao.getCategoryByPublicId(publicId);
  if (!category) throw new NotFoundError("Mobile Category not found");

  const dataToUpdate = { ...data };

  if (imageBuffer && mimeType) {
    try {
      const webpBuffer = await convertToWebP(imageBuffer, DEFAULT_QUALITY, mimeType, 256, 256);
      const sanitizedName = sanitizeFileName(imageName);
      const key = `mobile-category-images/${category.id}/${sanitizedName}-${uuidv7()}.webp`;
      await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
      dataToUpdate.imageUrl = s3Service.getFileUrl(key);
    } catch (err) {
      logger.error("Failed to update mobile category image", { categoryId: category.id, error: err });
    }
  }

  await dao.updateCategoryById(category.id, dataToUpdate);
  return await dao.getCategoryById(category.id);
};

exports.deleteCategoryByPublicId = async (publicId) => {
  const category = await dao.getCategoryByPublicId(publicId);
  if (!category) throw new NotFoundError("Mobile Category not found");
  return await dao.softDeleteCategoryById(category.id);
};
