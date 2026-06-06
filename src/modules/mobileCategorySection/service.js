const dao = require("./dao");
const s3Service = require("../../services/s3");
const { convertToWebP, sanitizeFileName, DEFAULT_QUALITY } = require("../../utils/imageProcessor");
const { v7: uuidv7 } = require("uuid");
const logger = require("../../config/logger");
const { ValidationError, NotFoundError } = require("../../utils/errors");

const processTilesRecursively = async (tilesArray, files) => {
  if (!Array.isArray(tilesArray)) return [];
  const processed = [];
  for (const tile of tilesArray) {
    let imageUrl = tile.imageUrl || null;
    if (tile.imageFieldKey) {
      const tileFile = (files || []).find(f => f.fieldname === tile.imageFieldKey);
      if (tileFile) {
        const webpBuffer = await convertToWebP(tileFile.buffer, DEFAULT_QUALITY, tileFile.mimetype, 512, 512);
        const sanitizedName = sanitizeFileName(tileFile.originalname);
        const key = `mobile-sections/tiles/${uuidv7()}-${sanitizedName}.webp`;
        await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
        imageUrl = s3Service.getFileUrl(key);
      }
    }

    let bannerUrl = tile.bannerUrl || null;
    if (tile.bannerFieldKey) {
      const bannerFile = (files || []).find(f => f.fieldname === tile.bannerFieldKey);
      if (bannerFile) {
        const webpBuffer = await convertToWebP(bannerFile.buffer, DEFAULT_QUALITY, bannerFile.mimetype, 512, 512);
        const sanitizedName = sanitizeFileName(bannerFile.originalname);
        const key = `mobile-sections/tiles/${uuidv7()}-${sanitizedName}.webp`;
        await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
        bannerUrl = s3Service.getFileUrl(key);
      }
    }

    const processedTile = {
      name: tile.name || null,
      sectionName: tile.sectionName || null,
      imageUrl: imageUrl,
      bannerUrl: bannerUrl,
      redirection_id: tile.redirection_id || null,
      tiles: [],
    };
    if (tile.tiles && Array.isArray(tile.tiles)) {
      processedTile.tiles = await processTilesRecursively(tile.tiles, files);
    }
    processed.push(processedTile);
  }
  return processed;
};

exports.createSection = async (data, files) => {
  if (data.imageUrl === 'null' || data.imageUrl === '') {
    data.imageUrl = null;
  }
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
  let tiles = [];
  if (data.tilesStructure) {
    const structure = JSON.parse(data.tilesStructure);
    tiles = await processTilesRecursively(structure, files);
  } else {
    // Fallback to legacy flat format
    const tilesCount = parseInt(data.tilesCount || 0);
    for (let i = 0; i < tilesCount; i++) {
      const redirectionId = data[`tile_redirection_${i}`];
      const tileName = data[`tile_name_${i}`];
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
        name: tileName || null,
        sectionName: null,
        imageUrl: tileImageUrl,
        redirection_id: redirectionId,
        tiles: [],
      });
    }
  }

  data.tiles = tiles;
  const created = await dao.create(data);
  return sanitizeSection(created);
};

const sanitizeTiles = (tiles) => {
  if (!Array.isArray(tiles)) return [];
  return tiles.map(tile => {
    return {
      name: tile.name || null,
      sectionName: tile.sectionName || null,
      imageUrl: tile.imageUrl || null,
      bannerUrl: tile.bannerUrl || null,
      redirection_id: tile.redirection_id || null,
      tiles: sanitizeTiles(tile.tiles)
    };
  });
};

const sanitizeSection = (section) => {
  if (!section) return null;
  const plainSection = typeof section.toJSON === "function" ? section.toJSON() : section;
  plainSection.tiles = sanitizeTiles(plainSection.tiles);
  return plainSection;
};

exports.getAllSections = async (filters) => {
  const sections = await dao.getAll(filters);
  return sections.map(sanitizeSection);
};

exports.getSectionById = async (id) => {
  const section = await dao.getById(id);
  if (!section) throw new NotFoundError("Section not found");
  return sanitizeSection(section);
};

exports.updateSection = async (id, data, files) => {
  const existing = await dao.getById(id);
  if (!existing) throw new NotFoundError("Section not found");

  const updateData = { ...data };
  if (updateData.imageUrl === 'null' || updateData.imageUrl === '') {
    updateData.imageUrl = null;
  }

  // Handle Section Icon Update
  const sectionFile = (files || []).find(f => f.fieldname === 'image');
  if (sectionFile) {
    const webpBuffer = await convertToWebP(sectionFile.buffer, DEFAULT_QUALITY, sectionFile.mimetype, 512, 512);
    const sanitizedName = sanitizeFileName(sectionFile.originalname);
    const key = `mobile-sections/icons/${uuidv7()}-${sanitizedName}.webp`;
    await s3Service.uploadBuffer(webpBuffer, key, "image/webp");
    updateData.imageUrl = s3Service.getFileUrl(key);
  }

  // Handle Tiles Update
  if (data.tilesStructure) {
    const structure = JSON.parse(data.tilesStructure);
    updateData.tiles = await processTilesRecursively(structure, files);
  } else if (data.tilesCount !== undefined) {
    // Fallback to legacy flat format
    const tiles = [];
    const tilesCount = parseInt(data.tilesCount || 0);

    for (let i = 0; i < tilesCount; i++) {
      const redirectionId = data[`tile_redirection_${i}`];
      const tileName = data[`tile_name_${i}`];
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
        name: tileName || null,
        sectionName: null,
        imageUrl: tileImageUrl,
        redirection_id: redirectionId,
        tiles: [],
      });
    }
    updateData.tiles = tiles;
  }

  await dao.update(id, updateData);
  const updated = await dao.getById(id);
  return sanitizeSection(updated);
};

exports.deleteSection = async (id) => {
  return await dao.delete(id);
};

exports.getSectionsByCategoryId = async (categoryId) => {
  if (!categoryId || isNaN(categoryId)) {
    throw new ValidationError("Valid categoryId is required");
  }
  const sections = await dao.getByCategoryId(parseInt(categoryId));
  return sections.map(sanitizeSection);
};
