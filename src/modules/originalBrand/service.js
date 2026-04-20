const dao = require("./dao");
const s3Service = require("../../services/s3");
const { convertToWebP, DEFAULT_QUALITY } = require("../../utils/imageProcessor");
const { v4: uuidv4 } = require("uuid");

const getAllOriginalBrands = async (filter = {}) => {
  return await dao.findAll(filter);
};

const createOriginalBrand = async (data, file) => {
  if (file) {
    const webpBuffer = await convertToWebP(file.buffer, DEFAULT_QUALITY, file.mimetype);
    const s3Key = `original-brands/${Date.now()}-${uuidv4()}.webp`;
    await s3Service.uploadBuffer(webpBuffer, s3Key, "image/webp");
    data.imgUrl = s3Service.getFileUrl(s3Key);
  }
  return await dao.create(data);
};

const updateOriginalBrand = async (publicId, data, file) => {
  if (file) {
    const webpBuffer = await convertToWebP(file.buffer, DEFAULT_QUALITY, file.mimetype);
    const s3Key = `original-brands/${Date.now()}-${uuidv4()}.webp`;
    await s3Service.uploadBuffer(webpBuffer, s3Key, "image/webp");
    data.imgUrl = s3Service.getFileUrl(s3Key);
  }
  return await dao.update(publicId, data);
};

const deleteOriginalBrand = async (publicId) => {
  return await dao.deleteOne(publicId);
};

module.exports = {
  getAllOriginalBrands,
  createOriginalBrand,
  updateOriginalBrand,
  deleteOriginalBrand,
};
