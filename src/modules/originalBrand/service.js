const dao = require("./dao");
const { uploadBuffer } = require("../../services/s3");
const config = require("config");

const getAllOriginalBrands = async (filter = {}) => {
  return await dao.findAll(filter);
};

const createOriginalBrand = async (data, file) => {
  if (file) {
    const s3Key = await uploadBuffer(
      file.buffer,
      `original-brands/${Date.now()}.webp`,
      file.mimetype
    );
    data.imgUrl = `${config.get("aws.cloudfront.domain")}/${s3Key}`;
  }
  return await dao.create(data);
};

const updateOriginalBrand = async (publicId, data, file) => {
  if (file) {
    const s3Key = await uploadBuffer(
      file.buffer,
      `original-brands/${Date.now()}.webp`,
      file.mimetype
    );
    data.imgUrl = `${config.get("aws.cloudfront.domain")}/${s3Key}`;
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
