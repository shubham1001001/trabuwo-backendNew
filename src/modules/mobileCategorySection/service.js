const dao = require("./dao");
const s3Service = require("../../services/s3");
const { convertToWebP, sanitizeFileName, DEFAULT_QUALITY } = require("../../utils/imageProcessor");
const { v7: uuidv7 } = require("uuid");
const logger = require("../../config/logger");
const { ValidationError, NotFoundError } = require("../../utils/errors");

exports.createSection = async (data, files) => {
  // Handle Section Icon
  const sectionFile = (files || []).find(f => f.fieldname === 'image');
  if (sectionFile) {
    const webpBuffer = await convertToWebP(sectionFile.buffer, DEFAULT_QUALITY, sectionFile.mimetype, 512, 512);
    const sanitizedName = sanitizeFileName(sectionFile.originalname);
    const key = `mobile-sections/icons/${uuidv7()}-${sanitizedName}.webp`;
    await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
    data.imageUrl = s3Service.getFileUrl(key);
  }

  // Handle Tiles
  const tiles = [];
  const tilesCount = parseInt(data.tilesCount || 0);

  for (let i = 0; i < tilesCount; i++) {
    const redirectionId = data[`tile_redirection_${i}`];
    let tileImageUrl = null;

    const tileFile = (files || []).find(f => f.fieldname === `tile_image_${i}`);
    if (tileFile) {
      const webpBuffer = await convertToWebP(tileFile.buffer, DEFAULT_QUALITY, tileFile.mimetype, 512, 512);
      const sanitizedName = sanitizeFileName(tileFile.originalname);
      const key = `mobile-sections/tiles/${uuidv7()}-${sanitizedName}.webp`;
      await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
      tileImageUrl = s3Service.getFileUrl(key);
    }

    tiles.push({
      imageUrl: tileImageUrl,
      redirection_id: redirectionId,
    });
  }

  data.tiles = tiles;
  return await dao.create(data);
};

exports.getAllSections = async (filters) => {
  return await dao.getAll(filters);
};

exports.getSectionById = async (id) => {
  const section = await dao.getById(id);
  if (!section) throw new NotFoundError("Section not found");
  return section;
};

exports.updateSection = async (id, data, files) => {
  const existing = await dao.getById(id);
  if (!existing) throw new NotFoundError("Section not found");

  const updateData = { ...data };

  // Handle Section Icon Update
  const sectionFile = (files || []).find(f => f.fieldname === 'image');
  if (sectionFile) {
    const webpBuffer = await convertToWebP(sectionFile.buffer, DEFAULT_QUALITY, sectionFile.mimetype, 512, 512);
    const sanitizedName = sanitizeFileName(sectionFile.originalname);
    const key = `mobile-sections/icons/${uuidv7()}-${sanitizedName}.webp`;
    await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
    updateData.imageUrl = s3Service.getFileUrl(key);
  }

  // Handle Tiles Update (this logic assumes a full replacement for simplicity in this version)
  if (data.tilesCount !== undefined) {
    const tiles = [];
    const tilesCount = parseInt(data.tilesCount || 0);

    for (let i = 0; i < tilesCount; i++) {
      const redirectionId = data[`tile_redirection_${i}`];
      let tileImageUrl = data[`tile_existing_url_${i}`] || null;

      const tileFile = (files || []).find(f => f.fieldname === `tile_image_${i}`);
      if (tileFile) {
        const webpBuffer = await convertToWebP(tileFile.buffer, DEFAULT_QUALITY, tileFile.mimetype, 512, 512);
        const sanitizedName = sanitizeFileName(tileFile.originalname);
        const key = `mobile-sections/tiles/${uuidv7()}-${sanitizedName}.webp`;
        await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
        tileImageUrl = s3Service.getFileUrl(key);
      }

      tiles.push({
        imageUrl: tileImageUrl,
        redirection_id: redirectionId,
      });
    }
    updateData.tiles = tiles;
  }

  await dao.update(id, updateData);
  return await dao.getById(id);
};

exports.deleteSection = async (id) => {
  return await dao.delete(id);
};

exports.getSectionsByCategoryId = async (categoryId) => {
  if (!categoryId || isNaN(categoryId)) {
    throw new ValidationError("Valid categoryId is required");
  }
  return await dao.getByCategoryId(parseInt(categoryId));
};
