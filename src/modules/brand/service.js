const dao = require("./dao");
const slugify = require("slugify");
const { v4: uuidv4 } = require("uuid");

const {
  NotFoundError,
  ConflictError,
} = require("../../utils/errors");

/**
 * CREATE BRAND
 */
exports.createBrand = async (payload, user) => {
  const { name } = payload;

  // slug generate
  const slug = slugify(name, { lower: true, strict: true });

  // duplicate check
  const existing = await dao.findBySlug(slug);
  if (existing) {
    throw new ConflictError("Brand already exists");
  }

  const brand = await dao.create({
    ...payload,
    slug,
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