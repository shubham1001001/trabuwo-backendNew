const dao = require("./dao");
const { NotFoundError, ValidationError } = require("../../utils/errors");

const createCampaign = async (campaignData) => {
  return await dao.createCampaign(campaignData);
};

const getCampaignById = async (id) => {
  const campaign = await dao.getCampaignById(id);
  if (!campaign) {
    throw new NotFoundError("Campaign not found");
  }
  return campaign;
};

const getAllCampaigns = async (filters) => {
  return await dao.getAllCampaigns(filters);
};

const updateCampaign = async (id, updateData) => {
  const campaign = await dao.getCampaignById(id);
  if (!campaign) {
    throw new NotFoundError("Campaign not found");
  }

  const updated = await dao.updateCampaign(id, updateData);
  if (!updated) {
    throw new ValidationError("Failed to update campaign");
  }

  return await dao.getCampaignById(id);
};

const deleteCampaign = async (id) => {
  const campaign = await dao.getCampaignById(id);
  if (!campaign) {
    throw new NotFoundError("Campaign not found");
  }

  const deleted = await dao.deleteCampaign(id);
  if (!deleted) {
    throw new ValidationError("Failed to delete campaign");
  }

  return { message: "Campaign deleted successfully" };
};

const getCampaignCatalogueById = async (id) => {
  const campaignCatalogue = await dao.getCampaignCatalogueById(id);
  if (!campaignCatalogue) {
    throw new NotFoundError("Campaign catalogue not found");
  }
  return campaignCatalogue;
};

const getCampaignCataloguesByCampaignId = async (campaignId) => {
  return await dao.getCampaignCataloguesByCampaignId(campaignId);
};

const updateCampaignCatalogue = async (id, updateData, userId) => {
  return await dao.updateCampaignCatalogue(id, updateData, userId);
};

const deleteCampaignCatalogue = async (id) => {
  const campaignCatalogue = await dao.getCampaignCatalogueById(id);
  if (!campaignCatalogue) {
    throw new NotFoundError("Campaign catalogue not found");
  }

  const deleted = await dao.deleteCampaignCatalogue(id);
  if (!deleted) {
    throw new ValidationError("Failed to delete campaign catalogue");
  }

  return { message: "Campaign catalogue deleted successfully" };
};

const getAvailableCatalogues = async (filters) => {
  return await dao.getAvailableCatalogues(filters);
};

const restartCampaign = async (campaignId, userId, catalogueData) => {
  return await dao.restartCampaign(campaignId, userId, catalogueData);
};

module.exports = {
  createCampaign,
  getCampaignById,
  getAllCampaigns,
  updateCampaign,
  deleteCampaign,
  getCampaignCatalogueById,
  getCampaignCataloguesByCampaignId,
  updateCampaignCatalogue,
  deleteCampaignCatalogue,
  getAvailableCatalogues,
  restartCampaign,
};
