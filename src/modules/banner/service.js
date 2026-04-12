const { 
  processImageForUpload, 
  sanitizeFileName 
} = require("../../utils/imageProcessor");
const sharp = require("sharp");
const dao = require("./dao");
const s3Service = require("../../services/s3");
const config = require("config");
const {
  NotFoundError,
  ResourceCreationError,
  ValidationError,
} = require("../../utils/errors");

const BANNER_QUALITY_RULES = {
  minWidth: 1440,
  minHeight: 500,
  preferredWidth: 1920,
  preferredHeight: 640,
};

const buildCdnUrl = (assetPath) => {
  const cloudfrontDomain = config.get("aws.cloudfront.domain") || "";
  const normalizedDomain = cloudfrontDomain.replace(/\/+$/, "");
  const normalizedPath = String(assetPath || "").replace(/^\/+/, "");

  if (!normalizedDomain) return normalizedPath;
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  if (/^https?:\/\//i.test(normalizedDomain)) {
    return `${normalizedDomain}/${normalizedPath}`;
  }
  return `https://${normalizedDomain}/${normalizedPath}`;
};

const validateBannerImageQuality = async (imageBuffer) => {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (!width || !height) {
    throw new ValidationError("Unable to read banner dimensions");
  }

  if (
    width < BANNER_QUALITY_RULES.minWidth ||
    height < BANNER_QUALITY_RULES.minHeight
  ) {
    throw new ValidationError(
      `Banner too small (${width}x${height}). Minimum required is ${BANNER_QUALITY_RULES.minWidth}x${BANNER_QUALITY_RULES.minHeight}. Recommended ${BANNER_QUALITY_RULES.preferredWidth}x${BANNER_QUALITY_RULES.preferredHeight}.`
    );
  }

};

const processAndUploadBannerImages = async (
  imageBuffer,
  bannerId,
  originalMimeType,
  originalName = "banner"
) => {
  try {
    const sizes = [
      { name: "small", width: 640 },
      { name: "medium", width: 1280 },
      { name: "large", width: 1920 },
    ];

    const sanitizedName = sanitizeFileName(originalName);
    const timestamp = Date.now();

    const imageProcessingPromises = sizes.map(async (size) => {
      const webpBuffer = await processImageForUpload(imageBuffer, {
        width: size.width,
        mimeType: originalMimeType,
        quality: 88
      });

      return {
        size: size.name,
        buffer: webpBuffer,
        key: `banners/${bannerId}/${timestamp}-${size.name}-${sanitizedName}.webp`,
      };
    });

    const processedImages = await Promise.all(imageProcessingPromises);

    // Upload processed images
    const uploadPromises = processedImages.map(({ buffer, key }) =>
      s3Service.uploadBuffer(buffer, key, "image/webp")
    );

    // Also upload the original as fallback
    const originalExt = originalMimeType.split("/")[1] || "jpg";
    const originalKey = `banners/${bannerId}/${timestamp}-original-${sanitizedName}.${originalExt}`;
    uploadPromises.push(
      s3Service.uploadBuffer(imageBuffer, originalKey, originalMimeType)
    );

    const uploadResults = await Promise.all(uploadPromises);

    const imageUrls = {
      smallImageUrl: buildCdnUrl(uploadResults[0]),
      mediumImageUrl: buildCdnUrl(uploadResults[1]),
      largeImageUrl: buildCdnUrl(uploadResults[2]),
      fallbackImageUrl: buildCdnUrl(uploadResults[3]),
    };

    return imageUrls;
  } catch (error) {
    throw new ResourceCreationError(
      "Failed to process and upload banner images",
      {
        originalError: error.message,
      }
    );
  }
};

const createBanner = async (bannerData, imageBuffer, originalMimeType, originalName = "banner") => {
  try {
    await validateBannerImageQuality(imageBuffer);

    const parsedIsActive =
      bannerData.isActive === undefined
        ? true
        : bannerData.isActive === "true" || bannerData.isActive === true;

    const banner = await dao.createBanner({
      title: bannerData.title,
      description: bannerData.description,
      section: bannerData.section,
      position: Number(bannerData.position) || 1,
      isActive: parsedIsActive,
      startTime: bannerData.startTime,
      endTime: bannerData.endTime,
      clickUrl: bannerData.clickUrl || null,
    });

    const imageUrls = await processAndUploadBannerImages(
      imageBuffer,
      banner.id,
      originalMimeType,
      originalName
    );

    const updatedBanner = await dao.updateBannerById(banner.id, imageUrls);

    return updatedBanner;
  } catch (error) {
    throw new ResourceCreationError("Failed to create banner", {
      originalError: error.message,
    });
  }
};

const getBannerById = async (id) => {
  const banner = await dao.getBannerById(id);
  if (!banner) {
    throw new NotFoundError("Banner not found");
  }
  return banner;
};

const getAllBanners = async (filters = {}) => {
  return await dao.getAllBanners(filters);
};

const getBannersBySection = async (section) => {
  return await dao.getBannersBySection(section);
};

const updateBannerById = async (
  id,
  updateData,
  imageBuffer = null,
  originalMimeType = null
) => {
  const existingBanner = await dao.getBannerById(id);
  if (!existingBanner) {
    throw new NotFoundError("Banner not found");
  }

  let imageUrls = {};

  // If new image is provided, process and upload it
  if (imageBuffer && originalMimeType) {
    await validateBannerImageQuality(imageBuffer);
    imageUrls = await processAndUploadBannerImages(
      imageBuffer,
      id,
      originalMimeType
    );
  }

  const updatedData = { ...updateData, ...imageUrls };
  const updatedBanner = await dao.updateBannerById(id, updatedData);

  return updatedBanner;
};

const softDeleteBannerById = async (id) => {
  const banner = await dao.getBannerById(id);
  if (!banner) {
    throw new NotFoundError("Banner not found");
  }

  await dao.softDeleteBannerById(id);
  return { message: "Banner deleted successfully" };
};

const getBannersWithPagination = async (page = 1, limit = 10, filters = {}) => {
  return await dao.getBannersWithPagination(page, limit, filters);
};

const getBannerCount = async (filters = {}) => {
  return await dao.getBannerCount(filters);
};

const bulkUpdateBanners = async (updates) => {
  return await dao.bulkUpdateBanners(updates);
};

const getActiveBannersCount = async () => {
  return await dao.getActiveBannersCount();
};

const activateDeactivateBanner = async (id, isActive) => {
  const banner = await dao.getBannerById(id);
  if (!banner) {
    throw new NotFoundError("Banner not found");
  }

  return await dao.updateBannerById(id, { isActive });
};

module.exports = {
  createBanner,
  getBannerById,
  getAllBanners,
  getBannersBySection,
  updateBannerById,
  softDeleteBannerById,
  getBannersWithPagination,
  getBannerCount,
  bulkUpdateBanners,
  getActiveBannersCount,
  activateDeactivateBanner,
};
