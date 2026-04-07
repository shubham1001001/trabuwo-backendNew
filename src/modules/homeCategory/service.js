const dao = require("./dao");
const categorySectionDao = require("../categorySection/dao");
const categoryDao = require("../category/dao");
const { NotFoundError, ValidationError } = require("../../utils/errors");
const { wouldCreateCycle } = require("../../utils/parentChildCycle");
const s3Service = require("../../services/s3");
const config = require("config");
const sequelize = require("../../config/database");
const logger = require("../../config/logger");
const { v7: uuidv7 } = require("uuid");
const {
  convertToWebP,
  sanitizeFileName,
  DEFAULT_QUALITY,
} = require("../../utils/imageProcessor");

exports.createHomeCategory = async (
  payload,
  imageBuffer = null,
  mimeType = null,
  imageName = null
) => {
  // Check name uniqueness
  if (payload.name) {
    const existingName = await dao.getHomeCategoryByName(payload.name);
    if (existingName) {
      throw new ValidationError("A home category with this name already exists. Please choose a unique name.");
    }
  }

  // Check active limit if new category is being set to active
  const deviceType = payload.deviceType || "both";
  if (payload.isActive === true && payload.parentId === null) {
    if (deviceType === "web" || deviceType === "both") {
      const activeWebCount = await dao.countActiveHomeCategories("web");
      if (activeWebCount >= 8) {
        throw new ValidationError("Maximum of 8 home categories can be active for Web at a time. Please deactivate an existing one first.");
      }
    }
    // Mobile limit can be added here if needed in the future
  }

  if (payload.parentId) {
    const parent = await dao.getHomeCategoryById(payload.parentId);
    if (!parent || parent.isDeleted) {
      throw new ValidationError("Parent home category does not exist");
    }
  }

  if (payload.sectionId) {
    const section = await categorySectionDao.getSectionById(payload.sectionId);
    if (!section || section.isDeleted) {
      throw new ValidationError("Category section does not exist");
    }
  }

  if (payload.redirectCategoryId) {
    const category = await categoryDao.getCategoryById(
      payload.redirectCategoryId
    );
    if (!category || category.isDeleted) {
      throw new ValidationError("Redirect category does not exist");
    }
  }

  const created = await dao.createHomeCategory(payload);

  const updateData = {};
  if (imageBuffer && mimeType) {
    const webpBuffer = await convertToWebP(
      imageBuffer,
      DEFAULT_QUALITY,
      mimeType,
      256,
      256
    );
    const sanitizedName = sanitizeFileName(imageName);
    const key = `home-category-images/${
      created.id
    }/${sanitizedName}-${uuidv7()}.webp`;
    await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
    updateData.imgUrl = `${config.get("aws.cloudfront.domain")}/${key}`;
  }

  if (Object.keys(updateData).length > 0) {
    await dao.updateHomeCategoryById(created.id, updateData);
  }

  const fresh = await dao.getHomeCategoryById(created.id);
  return fresh;
};

exports.getAllHomeCategories = async (filters = {}) => {
  const where = { isDeleted: false };

  if (filters.sectionId !== undefined) {
    where.sectionId = filters.sectionId;
  }

  if (filters.parentId !== undefined) {
    where.parentId = filters.parentId;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.deviceType && filters.deviceType !== "both") {
    where.deviceType = filters.deviceType;
  }

  return await dao.getAllHomeCategories(where);
};

exports.getHomeCategoryByPublicId = async (publicId) => {
  const existing = await dao.getHomeCategoryByPublicId(publicId);
  if (!existing || existing.isDeleted) {
    throw new NotFoundError("Home category not found");
  }
  return existing;
};

exports.updateHomeCategory = async (
  publicId,
  payload,
  imageBuffer = null,
  mimeType = null,
  imageName = null
) => {
  const existing = await dao.getHomeCategoryByPublicId(publicId);
  if (!existing || existing.isDeleted) {
    throw new NotFoundError("Home category not found");
  }

  if (payload.name && payload.name !== existing.name) {
    const existingName = await dao.getHomeCategoryByName(payload.name);
    if (existingName) {
      throw new ValidationError("A home category with this name already exists. Please choose a unique name.");
    }
  }

  if (payload.parentId !== undefined && payload.parentId === existing.id) {
    throw new ValidationError("Home category cannot be its own parent");
  }

  if (payload.parentId) {
    const parent = await dao.getHomeCategoryById(payload.parentId);
    if (!parent || parent.isDeleted) {
      throw new ValidationError("Parent home category does not exist");
    }

    const allHomeCategories = await dao.getAllHomeCategories({
      isDeleted: false,
    });
    const nodes = allHomeCategories.map((hc) => ({
      id: hc.id,
      parentId: hc.parentId,
    }));
    if (wouldCreateCycle(nodes, existing.id, payload.parentId)) {
      throw new ValidationError(
        "Setting this parent would create a circular dependency in the home category hierarchy.",
      );
    }
  }

  if (payload.sectionId) {
    const section = await categorySectionDao.getSectionById(payload.sectionId);
    if (!section || section.isDeleted) {
      throw new ValidationError("Category section does not exist");
    }
  }

  if (payload.redirectCategoryId) {
    const category = await categoryDao.getCategoryById(
      payload.redirectCategoryId
    );
    if (!category || category.isDeleted) {
      throw new ValidationError("Redirect category does not exist");
    }
  }

  let newImgUrl = null;
  let newImgKey = null;
  const oldImgKey = existing.imgUrl
    ? existing.imgUrl.replace(`${config.get("aws.cloudfront.domain")}/`, "")
    : null;

  if (imageBuffer && mimeType) {
    const webpBuffer = await convertToWebP(
      imageBuffer,
      DEFAULT_QUALITY,
      mimeType
    );
    const sanitizedName = sanitizeFileName(imageName);

    // Add uuid to key for randomness
    const key = `home-category-images/${
      existing.id
    }/${sanitizedName}-${uuidv7()}.webp`;
    const uploadedKey = await s3Service.uploadBuffer(
      webpBuffer,
      key,
      "image/webp"
    );
    newImgUrl = `${config.get("aws.cloudfront.domain")}/${uploadedKey}`;
    newImgKey = uploadedKey;
  }

  try {
    await sequelize.transaction(async (t) => {
      const updateData = {};

      if (payload.name !== undefined) {
        updateData.name = payload.name;
      }
      if (payload.parentId !== undefined) {
        updateData.parentId = payload.parentId;
      }
      if (payload.sectionId !== undefined) {
        updateData.sectionId = payload.sectionId;
      }
      if (payload.redirectCategoryId !== undefined) {
        updateData.redirectCategoryId = payload.redirectCategoryId;
      }
      if (payload.displayOrder !== undefined) {
        updateData.displayOrder = payload.displayOrder;
      }
      if (payload.isActive !== undefined && payload.parentId === null) {
        if (payload.isActive === true && (existing.isActive !== true || payload.deviceType !== undefined)) {
          const targetDevice = payload.deviceType || existing.deviceType;
          if (targetDevice === "web" || targetDevice === "both") {
             const activeWebCount = await dao.countActiveHomeCategories("web");
             // If we're already part of the web count, we don't increment the check
             const isAlreadyWeb = existing.isActive && (existing.deviceType === "web" || existing.deviceType === "both");
             if (activeWebCount >= 8 && !isAlreadyWeb) {
               throw new ValidationError("Maximum of 8 home categories can be active for Web at a time. Please deactivate an existing one first.");
             }
          }
        }
        updateData.isActive = payload.isActive;
      }
      if (payload.showOnHomePage !== undefined) {
        updateData.showOnHomePage = payload.showOnHomePage;
      }
      if (payload.deviceType !== undefined) {
        updateData.deviceType = payload.deviceType;
      }
      if (payload.filters !== undefined) {
        updateData.filters =
          typeof payload.filters === "string"
            ? JSON.parse(payload.filters)
            : payload.filters;
      }
      if (imageBuffer && mimeType) {
        updateData.imgUrl = newImgUrl;
      }

      await dao.updateHomeCategoryById(existing.id, updateData, {
        transaction: t,
      });
    });

    if (imageBuffer && mimeType) {
      try {
        if (oldImgKey) await s3Service.deleteObject(oldImgKey);
      } catch (err) {
        logger.error("Failed to delete old home category image", {
          oldImgKey,
          error: err,
        });
      }
    }

    const fresh = await dao.getHomeCategoryById(existing.id);
    return fresh;
    } catch (err) {
      if (imageBuffer && mimeType && newImgKey) {
        try {
          await s3Service.deleteObject(newImgKey);
        } catch (s3err) {
          logger.error("Failed to delete new image after update error", {
            newImgKey,
            error: s3err,
          });
        }
      }
      require('fs').writeFileSync('tmp_err.txt', err.stack || err.toString());
      throw err;
    }
};

exports.deleteHomeCategory = async (publicId) => {
  const existing = await dao.getHomeCategoryByPublicId(publicId);
  if (!existing || existing.isDeleted) {
    throw new NotFoundError("Home category not found");
  }

  await dao.softDeleteHomeCategoryById(existing.id);
  return true;
};

exports.getHomeCategoryTree = async (deviceType = null) => {
  return await dao.getHomeCategoryTree(deviceType);
};

exports.getHomeCategoriesBySection = async (sectionId, deviceType = null) => {
  const section = await categorySectionDao.getSectionById(sectionId);
  if (!section || section.isDeleted || !section.isActive) {
    throw new NotFoundError("Category section not found or inactive");
  }

  return await dao.getHomeCategoriesBySectionId(sectionId, deviceType);
};

exports.getHomeCategoriesForHomePage = async (deviceType = null) => {
  return await dao.getHomeCategoriesForHomePage(deviceType);
};
