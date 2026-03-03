const SectionAsset = require("./model");

exports.createAsset = async (data, { transaction } = {}) => {
  return await SectionAsset.create(data, { transaction });
};

exports.getAssetByPublicId = async (publicId, { transaction } = {}) => {
  return await SectionAsset.findOne({
    where: { publicId, isDeleted: false },
    transaction,
  });
};

exports.updateAssetById = async (id, data, { transaction } = {}) => {
  await SectionAsset.update(data, { where: { id }, transaction });
  return await SectionAsset.findByPk(id, { transaction });
};

exports.getAssetsBySectionId = async (sectionId, { transaction } = {}) => {
  return await SectionAsset.findAll({
    where: { sectionId, isDeleted: false },
    transaction,
  });
};

exports.softDeleteAssetsBySectionId = async (
  sectionId,
  { transaction } = {}
) => {
  return await SectionAsset.update(
    { isDeleted: true, enabled: false },
    { where: { sectionId }, transaction }
  );
};
