const dao = require("./dao");
const slugify = require("slugify");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const s3Service = require("../../services/s3");
const {
  NotFoundError,
  ConflictError,
} = require("../../utils/errors");

/**
 * CREATE BRAND
 */
exports.createBrand = async (payload, user, files) => {
  const { name } = payload;

  const slug = slugify(name, { lower: true, strict: true });

  const existing = await dao.findBySlug(slug);
  if (existing) {
    throw new ConflictError("Brand already exists");
  }

  let logoUrl = null;
  let bannerUrl = null;

  //Upload LOGO
  if (files?.logo?.[0]) {
    const file = files.logo[0];

    const key = s3Service.generateFileName(
      file.originalname,
      user.id,
      "brand/logo"
    );

    await s3Service.uploadProfileBuffer(
      file.buffer,
      key,
      file.mimetype,
      {
        "uploaded-by": user.id.toString(),
        "upload-type": "brand-logo",
      }
    );

    logoUrl = s3Service.getFileUrl(key);
  }

  //Upload BANNER
  if (files?.banner?.[0]) {
    const file = files.banner[0];

    const key = s3Service.generateFileName(
      file.originalname,
      user.id,
      "brand/banner"
    );

    await s3Service.uploadProfileBuffer(
      file.buffer,
      key,
      file.mimetype,
      {
        "uploaded-by": user.id.toString(),
        "upload-type": "brand-banner",
      }
    );

    bannerUrl = s3Service.getFileUrl(key);
  }

  const brand = await dao.create({
    ...payload,
    slug,
    logoUrl,
    bannerUrl,
    publicId: uuidv4(),
    createdBy: user?.id,
  });

  return brand;
};
/**
 * GET BRAND BY PUBLIC ID
 */
exports.getBrandByPublicId = async (publicId) => {
  const brand = await dao.findByPublicId(publicId);

  if (!brand) {
    throw new NotFoundError("Brand not found");
  }

  return brand;
};

/**
 * UPDATE BRAND
 */
exports.updateBrand = async (publicId, payload, user) => {
  const brand = await dao.findByPublicId(publicId);

  if (!brand) {
    throw new NotFoundError("Brand not found");
  }

  // अगर name update हो रहा है → slug भी update
  if (payload.name && payload.name !== brand.name) {
    const slug = slugify(payload.name, {
      lower: true,
      strict: true,
    });

    const existing = await dao.findBySlug(slug);

    if (existing && existing.id !== brand.id) {
      throw new ConflictError("Brand with this name already exists");
    }

    payload.slug = slug;
  }

  await dao.update(brand.id, {
    ...payload,
    updatedBy: user?.id,
  });

  return await dao.findByPublicId(publicId);
};

/**
 * DELETE BRAND (soft delete recommended)
 */
exports.deleteBrand = async (publicId) => {
  const brand = await dao.findByPublicId(publicId);

  if (!brand) {
    throw new NotFoundError("Brand not found");
  }

  await dao.delete(brand.id);

  return true;
};

/**
 * LIST BRANDS (basic)
 */
exports.listBrands = async (query) => {
  const { page = 1, limit = 10 } = query;

  const offset = (page - 1) * limit;

  const result = await dao.list({
    limit: Number(limit),
    offset: Number(offset),
  });

  return result;
};




exports.listActiveBrands = async (query) => {
  const { page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const result = await dao.listActiveBrands({
    limit: Number(limit),
    offset: Number(offset),
    status: "active",
  });

  return result;
};