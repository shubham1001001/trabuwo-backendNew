const GoldSectionSettings = require("./model");

exports.getSettings = async () => {
  return await GoldSectionSettings.findOne({
    where: { isActive: true },
    order: [["id", "DESC"]],
  });
};

exports.updateSettings = async (id, data) => {
  return await GoldSectionSettings.update(data, { where: { id } });
};

exports.createSettings = async (data) => {
  return await GoldSectionSettings.create(data);
};
