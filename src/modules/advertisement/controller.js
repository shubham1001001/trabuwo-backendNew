const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

const createCampaign = asyncHandler(async (req, res) => {
  const campaignData = { ...req.body, userId: req.user.id };
  const campaign = await service.createCampaign(campaignData);
  return apiResponse.success(
    res,
    campaign,
    "Campaign created successfully",
    201
  );
});

const getCampaignById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const campaign = await service.getCampaignById(id);
  return apiResponse.success(res, campaign, "Campaign retrieved successfully");
});

const getAllCampaigns = asyncHandler(async (req, res) => {
  const { page, limit, ...otherFilters } = req.query;
  const filters = {
    userId: req.user.id,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    ...otherFilters,
  };
  const result = await service.getAllCampaigns(filters);
  return apiResponse.success(res, result, "Campaigns retrieved successfully");
});

const updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const campaign = await service.updateCampaign(id, updateData);
  return apiResponse.success(res, campaign, "Campaign updated successfully");
});

const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await service.deleteCampaign(id);
  return apiResponse.success(res, result, "Campaign deleted successfully");
});

const getCampaignCatalogueById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const campaignCatalogue = await service.getCampaignCatalogueById(id);
  return apiResponse.success(
    res,
    campaignCatalogue,
    "Campaign catalogue retrieved successfully"
  );
});

const getCampaignCataloguesByCampaignId = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const campaignCatalogues = await service.getCampaignCataloguesByCampaignId(
    campaignId
  );
  return apiResponse.success(
    res,
    campaignCatalogues,
    "Campaign catalogues retrieved successfully"
  );
});

const updateCampaignCatalogue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const campaignCatalogue = await service.updateCampaignCatalogue(
    id,
    updateData,
    req.user.id
  );
  return apiResponse.success(
    res,
    campaignCatalogue,
    "Campaign catalogue updated successfully"
  );
});

const deleteCampaignCatalogue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await service.deleteCampaignCatalogue(id);
  return apiResponse.success(
    res,
    result,
    "Campaign catalogue deleted successfully"
  );
});

const getAvailableCatalogues = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const filters = {
    userId: req.user.id,
    page: parseInt(page),
    limit: parseInt(limit),
  };
  const result = await service.getAvailableCatalogues(filters);
  return apiResponse.success(
    res,
    result,
    "Available catalogues retrieved successfully"
  );
});

const restartCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { catalogueData } = req.body;
  const campaign = await service.restartCampaign(
    id,
    req.user.id,
    catalogueData
  );
  return apiResponse.success(res, campaign, "Campaign restarted successfully");
});

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
