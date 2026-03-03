const s3Service = require("../../services/s3");
const config = require("config");
const sequelize = require("../../config/database");
const dao = require("./dao");
const categoryDao = require("../category/dao");
const logger = require("../../config/logger");
const { v7: uuidv7 } = require("uuid");
const { NotFoundError, ResourceCreationError } = require("../../utils/errors");
const {
  processImageForUpload,
  sanitizeFileName,
} = require("../../utils/imageProcessor");

const extractS3Key = (url) => {
  if (!url) return null;
  const withoutProtocol = url.replace(/^https?:\/\//, "");
  const parts = withoutProtocol.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : null;
};

const buildS3Key = (publicId, sanitizedName) => {
  const timestamp = Date.now();
  const uniqueSuffix = uuidv7();
  return `category-icons/${publicId}/${timestamp}-${uniqueSuffix}-${sanitizedName}.webp`;
};

exports.createCategoryIconWithUpload = async (
  payload,
  imageBuffer,
  mimeType,
  imageName = null
) => {
  if (!imageBuffer || !mimeType) {
    throw new ResourceCreationError(
      "Image file is required for category icon creation"
    );
  }

  const categoryId = Number(payload.categoryId);
  const category = await categoryDao.getCategoryById(categoryId);
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }

  const sanitizedName = sanitizeFileName(imageName);

  return await sequelize.transaction(async (t) => {
    const created = await dao.createCategoryIcon(
      {
        categoryId,
        altText: payload.altText,
        filter: payload.filter
          ? typeof payload.filter === "string"
            ? JSON.parse(payload.filter)
            : payload.filter
          : {},
        enabled: true,
        isDeleted: false,
        iconUrl: "", // temporary, will update after upload
        originalImageUrl: null,
      },
      { transaction: t }
    );

    const webpBuffer = await processImageForUpload(imageBuffer, {
      mimeType,
    });
    const key = buildS3Key(created.publicId, sanitizedName);
    const uploadedKey = await s3Service.uploadBuffer(
      webpBuffer,
      key,
      "image/webp"
    );

    const iconUrl = `${config.get("aws.cloudfront.domain")}/${uploadedKey}`;

    const updated = await dao.updateCategoryIconById(
      created.id,
      {
        iconUrl,
        originalImageUrl: iconUrl,
      },
      { transaction: t }
    );

    return updated;
  });
};

exports.updateCategoryIconWithUpload = async (
  publicId,
  payload,
  imageBuffer = null,
  mimeType = null,
  imageName = null
) => {
  const existingIcon = await dao.getCategoryIconByPublicId(publicId);
  if (!existingIcon) {
    throw new NotFoundError("Category icon not found");
  }

  let newIconUrl = null;
  let newIconKey = null;
  const oldIconKey = extractS3Key(existingIcon.iconUrl);

  if (imageBuffer && mimeType) {
    const sanitizedName = sanitizeFileName(imageName);
    const webpBuffer = await processImageForUpload(imageBuffer, {
      mimeType,
    });
    const key = buildS3Key(existingIcon.publicId, sanitizedName);
    const uploadedKey = await s3Service.uploadBuffer(
      webpBuffer,
      key,
      "image/webp"
    );
    newIconKey = uploadedKey;
    newIconUrl = `${config.get("aws.cloudfront.domain")}/${uploadedKey}`;
  }

  try {
    const updated = await sequelize.transaction(async (t) => {
      const updateData = {};

      if (payload.categoryId !== undefined) {
        const categoryId = Number(payload.categoryId);
        const category = await categoryDao.getCategoryById(categoryId);
        if (!category || category.isDeleted) {
          throw new NotFoundError("Category not found");
        }
        updateData.categoryId = categoryId;
      }

      if (payload.altText !== undefined) {
        updateData.altText = payload.altText;
      }

      if (payload.enabled !== undefined) {
        updateData.enabled = payload.enabled;
      }

      if (payload.filter !== undefined) {
        updateData.filter =
          typeof payload.filter === "string"
            ? JSON.parse(payload.filter)
            : payload.filter;
      }

      if (imageBuffer && mimeType) {
        updateData.iconUrl = newIconUrl;
        updateData.originalImageUrl = newIconUrl;
      }

      return await dao.updateCategoryIconById(existingIcon.id, updateData, {
        transaction: t,
      });
    });

    if (imageBuffer && mimeType && oldIconKey) {
      try {
        await s3Service.deleteObject(oldIconKey);
      } catch (error) {
        logger.error("Failed to delete old category icon image from S3", {
          oldIconKey,
          error,
        });
      }
    }

    return updated;
  } catch (error) {
    if (imageBuffer && mimeType && newIconKey) {
      try {
        await s3Service.deleteObject(newIconKey);
      } catch (cleanupError) {
        logger.error("Failed to rollback new category icon image from S3", {
          newIconKey,
          error: cleanupError,
        });
      }
    }
    throw error;
  }
};

exports.deleteCategoryIconByPublicId = async (publicId) => {
  const existingIcon = await dao.getCategoryIconByPublicId(publicId);
  if (!existingIcon) {
    throw new NotFoundError("Category icon not found");
  }

  const iconKey = extractS3Key(existingIcon.iconUrl);

  await sequelize.transaction(async (t) => {
    await dao.softDeleteCategoryIconById(existingIcon.id, { transaction: t });
  });

  if (!iconKey) {
    return;
  }

  try {
    await s3Service.deleteObject(iconKey);
  } catch (error) {
    logger.error("Failed to delete category icon image from S3", {
      iconKey,
      error,
    });
  }
};

exports.getCategoryIconsForCategoryId = async (categoryId) => {
  const category = await categoryDao.getCategoryById(Number(categoryId));
  if (!category || category.isDeleted) {
    throw new NotFoundError("Category not found");
  }

  const icons = await dao.getCategoryIconsByCategoryId(category.id);

  return icons.map((icon) => ({
    publicId: icon.publicId,
    iconUrl: icon.iconUrl,
    altText: icon.altText,
    filter: icon.filter,
  }));
};
