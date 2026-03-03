const dao = require("./dao");
const s3Service = require("../../services/s3");
const sharp = require("sharp");
const config = require("config");
const { NotFoundError, ResourceCreationError } = require("../../utils/errors");

const processAndUploadBannerImages = async (
  imageBuffer,
  bannerId,
  originalMimeType
) => {
  try {
    const sizes = [
      { name: "small", width: 320 },
      { name: "medium", width: 768 },
      { name: "large", width: 1200 },
    ];

    const isWebP = originalMimeType === "image/webp";
    const imageProcessingPromises = sizes.map(async (size) => {
      let webpBuffer;

      if (isWebP) {
        webpBuffer = await sharp(imageBuffer)
          .resize(size.width, null, { withoutEnlargement: true })
          .toBuffer();
      } else {
        webpBuffer = await sharp(imageBuffer)
          .resize(size.width, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
      }

      return {
        size: size.name,
        buffer: webpBuffer,
        key: `banners/${bannerId}/${size.name}.webp`,
      };
    });

    const processedImages = await Promise.all(imageProcessingPromises);

    const uploadPromises = [
      ...processedImages.map(({ buffer, key }) =>
        s3Service.uploadBuffer(buffer, key, "image/webp")
      ),
      s3Service.uploadBuffer(
        imageBuffer,
        `banners/${bannerId}/original.${originalMimeType.split("/")[1]}`,
        originalMimeType
      ),
    ];

    const uploadResults = await Promise.all(uploadPromises);

    const imageUrls = {
      smallImageUrl: `${config.get("aws.cloudfront.domain")}/${
        uploadResults[0]
      }`,
      mediumImageUrl: `${config.get("aws.cloudfront.domain")}/${
        uploadResults[1]
      }`,
      largeImageUrl: `${config.get("aws.cloudfront.domain")}/${
        uploadResults[2]
      }`,
      fallbackImageUrl: `${config.get("aws.cloudfront.domain")}/${
        uploadResults[3]
      }`,
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

const createBanner = async (bannerData, imageBuffer, originalMimeType) => {
  try {
    const banner = await dao.createBanner({
      title: bannerData.title,
      description: bannerData.description,
      section: bannerData.section,
      position: bannerData.position,
      isActive: bannerData.isActive || true,
      startTime: bannerData.startTime,
      endTime: bannerData.endTime,
      clickUrl: bannerData.clickUrl,
    });

    const imageUrls = await processAndUploadBannerImages(
      imageBuffer,
      banner.id,
      originalMimeType
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
