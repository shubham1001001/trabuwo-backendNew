const s3Service = require("../../services/s3");
const config = require("config");
const dao = require("./dao");
const sectionDao = require("../categorySection/dao");
const categoryDao = require("../category/dao");
const sequelize = require("../../config/database");
const logger = require("../../config/logger");
const { ResourceCreationError, NotFoundError } = require("../../utils/errors");
const {
  processImageForUpload,
  sanitizeFileName,
} = require("../../utils/imageProcessor");

const ICON_SIZES = [{ name: "icon-large", width: 512 }];

const extractS3Key = (url) => {
  if (!url) return null;
  const withoutProtocol = url.replace(/^https?:\/\//, "");
  const parts = withoutProtocol.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : null;
};

exports.createAssetWithUpload = async (
  assetPayload,
  imageBuffer,
  mimeType,
  imageName = null
) => {
  if (!imageBuffer || !mimeType) {
    throw new ResourceCreationError(
      "Image file is required for asset creation"
    );
  }

  const section = await sectionDao.getSectionById(assetPayload.sectionId);
  if (!section || section.isDeleted || section.isActive === false) {
    throw new NotFoundError("Section not found or inactive");
  }
  const redirectCategory = await categoryDao.getCategoryById(
    assetPayload.redirectCategoryId
  );
  if (!redirectCategory || redirectCategory.isDeleted) {
    throw new NotFoundError("Redirect category not found");
  }

  return await sequelize.transaction(async (t) => {
    const created = await dao.createAsset(
      {
        sectionId: assetPayload.sectionId,
        redirectCategoryId: assetPayload.redirectCategoryId,
        altText: assetPayload.altText,
        deviceType: assetPayload.deviceType,
        displayOrder: assetPayload.displayOrder,
        enabled:
          assetPayload.enabled !== undefined ? assetPayload.enabled : true,
        filters: assetPayload.filters
          ? typeof assetPayload.filters === "string"
            ? JSON.parse(assetPayload.filters)
            : assetPayload.filters
          : {},
      },
      { transaction: t }
    );

    const sanitizedName = sanitizeFileName(imageName);
    const timestamp = Date.now();

    const processed = await Promise.all(
      ICON_SIZES.map(async (size) => {
        const webpBuffer = await processImageForUpload(imageBuffer, {
          width: size.width,
          mimeType: mimeType,
        });
        const key = `section-assets/${created.id}/${sanitizedName}-${timestamp}-${size.name}.webp`;
        const uploadedKey = await s3Service.uploadBuffer(
          webpBuffer,
          key,
          "image/webp"
        );
        return {
          name: size.name,
          url: s3Service.getFileUrl(uploadedKey),
        };
      })
    );

    const originalWebpBuffer = await processImageForUpload(imageBuffer, {
      mimeType: mimeType,
    });
    const originalKey = `section-assets/${created.id}/${sanitizedName}-${timestamp}-original.webp`;
    const originalUploadedKey = await s3Service.uploadBuffer(
      originalWebpBuffer,
      originalKey,
      "image/webp"
    );

    const update = {
      iconLargeUrl: processed.find((p) => p.name === "icon-large")?.url,
      originalImageUrl: `${config.get(
        "aws.cloudfront.domain"
      )}/${originalUploadedKey}`,
    };

    const updated = await dao.updateAssetById(created.id, update, {
      transaction: t,
    });
    return updated;
  });
};

exports.updateAssetWithUpload = async (
  publicId,
  assetPayload,
  imageBuffer = null,
  mimeType = null,
  imageName = null
) => {
  const existingAsset = await dao.getAssetByPublicId(publicId);
  if (!existingAsset) {
    throw new NotFoundError("Section asset not found");
  }

  if (assetPayload.sectionId !== undefined) {
    const section = await sectionDao.getSectionById(assetPayload.sectionId);
    if (!section || section.isDeleted || section.isActive === false) {
      throw new NotFoundError("Section not found or inactive");
    }
  }

  if (assetPayload.redirectCategoryId !== undefined) {
    const redirectCategory = await categoryDao.getCategoryById(
      assetPayload.redirectCategoryId
    );
    if (!redirectCategory || redirectCategory.isDeleted) {
      throw new NotFoundError("Redirect category not found");
    }
  }

  let newIconLargeUrl = null;
  let newOriginalImageUrl = null;
  let newIconKey = null;
  let newOriginalKey = null;

  const oldIconKey = extractS3Key(existingAsset.iconLargeUrl);
  const oldOriginalKey = extractS3Key(existingAsset.originalImageUrl);

  if (imageBuffer && mimeType) {
    const sanitizedName = sanitizeFileName(imageName);
    const timestamp = Date.now();

    const processed = await Promise.all(
      ICON_SIZES.map(async (size) => {
        const webpBuffer = await processImageForUpload(imageBuffer, {
          width: size.width,
          mimeType: mimeType,
        });
        const key = `section-assets/${existingAsset.id}/${sanitizedName}-${timestamp}-${size.name}.webp`;
        const uploadedKey = await s3Service.uploadBuffer(
          webpBuffer,
          key,
          "image/webp"
        );
        return {
          name: size.name,
          url: s3Service.getFileUrl(uploadedKey),
          key: uploadedKey,
        };
      })
    );

    const originalWebpBuffer = await processImageForUpload(imageBuffer, {
      mimeType: mimeType,
    });
    const originalKey = `section-assets/${existingAsset.id}/${sanitizedName}-${timestamp}-original.webp`;
    const originalUploadedKey = await s3Service.uploadBuffer(
      originalWebpBuffer,
      originalKey,
      "image/webp"
    );

    newIconLargeUrl = processed.find((p) => p.name === "icon-large")?.url;
    newOriginalImageUrl = `${config.get(
      "aws.cloudfront.domain"
    )}/${originalUploadedKey}`;
    newIconKey = processed.find((p) => p.name === "icon-large")?.key;
    newOriginalKey = originalUploadedKey;
  }

  try {
    const updated = await sequelize.transaction(async (t) => {
      const updateData = {};
      if (assetPayload.sectionId !== undefined) {
        updateData.sectionId = assetPayload.sectionId;
      }
      if (assetPayload.redirectCategoryId !== undefined) {
        updateData.redirectCategoryId = assetPayload.redirectCategoryId;
      }
      if (assetPayload.altText !== undefined) {
        updateData.altText = assetPayload.altText;
      }
      if (assetPayload.deviceType !== undefined) {
        updateData.deviceType = assetPayload.deviceType;
      }
      if (assetPayload.displayOrder !== undefined) {
        updateData.displayOrder = assetPayload.displayOrder;
      }
      if (assetPayload.enabled !== undefined) {
        updateData.enabled = assetPayload.enabled;
      }
      if (assetPayload.filters !== undefined) {
        updateData.filters =
          typeof assetPayload.filters === "string"
            ? JSON.parse(assetPayload.filters)
            : assetPayload.filters;
      }
      if (imageBuffer && mimeType) {
        updateData.iconLargeUrl = newIconLargeUrl;
        updateData.originalImageUrl = newOriginalImageUrl;
      }

      return await dao.updateAssetById(existingAsset.id, updateData, {
        transaction: t,
      });
    });

    if (imageBuffer && mimeType) {
      try {
        if (oldIconKey) await s3Service.deleteObject(oldIconKey);
        if (oldOriginalKey) await s3Service.deleteObject(oldOriginalKey);
      } catch (err) {
        logger.error("Failed to delete old images", {
          oldIconKey,
          oldOriginalKey,
          error: err,
        });
      }
    }

    return updated;
  } catch (error) {
    if (imageBuffer && mimeType) {
      if (newIconKey) {
        await s3Service.deleteObject(newIconKey);
      }
      if (newOriginalKey) {
        await s3Service.deleteObject(newOriginalKey);
      }
    }
    throw error;
  }
};

exports.deleteSectionWithAssets = async (sectionPublicId) => {
  const section = await sectionDao.getSectionByPublicId(sectionPublicId);
  if (!section || section.isDeleted || section.isActive === false) {
    throw new NotFoundError("Section not found or inactive");
  }

  const assets = await dao.getAssetsBySectionId(section.id);

  const s3Keys = [];
  assets.forEach((asset) => {
    const iconKey = extractS3Key(asset.iconLargeUrl);
    const originalKey = extractS3Key(asset.originalImageUrl);
    if (iconKey) s3Keys.push(iconKey);
    if (originalKey) s3Keys.push(originalKey);
  });

  await sequelize.transaction(async (t) => {
    await sectionDao.updateSectionById(
      section.id,
      { isDeleted: true, isActive: false },
      { transaction: t }
    );

    await dao.softDeleteAssetsBySectionId(section.id, { transaction: t });
  });

  if (s3Keys.length === 0) {
    return;
  }

  try {
    await Promise.all(s3Keys.map((key) => s3Service.deleteObject(key)));
  } catch (error) {
    logger.error("Failed to delete section asset images from S3", {
      sectionId: section.id,
      sectionPublicId,
      s3Keys,
      error,
    });
  }
};

exports.deleteAssetByPublicId = async (publicId) => {
  const asset = await dao.getAssetByPublicId(publicId);
  if (!asset) {
    throw new NotFoundError("Section asset not found");
  }

  const iconKey = extractS3Key(asset.iconLargeUrl);
  const originalKey = extractS3Key(asset.originalImageUrl);

  await sequelize.transaction(async (t) => {
    await dao.updateAssetById(
      asset.id,
      { isDeleted: true, enabled: false },
      { transaction: t }
    );
  });

  const keysToDelete = [iconKey, originalKey].filter(Boolean);
  if (keysToDelete.length === 0) {
    return;
  }

  try {
    await Promise.all(keysToDelete.map((key) => s3Service.deleteObject(key)));
  } catch (error) {
    logger.error("Failed to delete section asset images from S3", {
      assetId: asset.id,
      publicId,
      keysToDelete,
      error,
    });
  }
};
