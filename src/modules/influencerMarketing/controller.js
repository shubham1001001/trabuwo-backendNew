const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

class InfluencerMarketingController {
  optIn = asyncHandler(async (req, res) => {
    const result = await service.optIn(req.user.id);
    return apiResponse.success(res, result, "Opt-in successful");
  });

  getOptIns = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const result = await service.getOptIns(status);
    return apiResponse.success(res, result, "Opt-ins fetched");
  });

  approveOptIn = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await service.approveOptIn(id, status);
    return apiResponse.success(res, result, "Opt-in status updated");
  });

  selectProduct = asyncHandler(async (req, res) => {
    const { productId, sellerId, catalogueId } = req.body;
    const influencerId = req.user.id;
    const result = await service.selectProduct({
      influencerId,
      sellerId,
      productId,
      catalogueId,
    });
    return apiResponse.success(res, result, "Product selected");
  });

  getMyPromotions = asyncHandler(async (req, res) => {
    const influencerId = req.user.id;
    const result = await service.getInfluencerPromotions(influencerId);
    return apiResponse.success(res, result, "Influencer promotions fetched");
  });

  addCatalogs = asyncHandler(async (req, res) => {
    const { catalogues } = req.body;
    const result = await service.addCatalogs(catalogues, req.user.id);
    return apiResponse.success(res, result, "Catalogs added successfully");
  });

  updateCommissions = asyncHandler(async (req, res) => {
    const { updates } = req.body;
    const result = await service.updateCommissions(updates);
    return apiResponse.success(res, result, "Commissions updated successfully");
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { ids, status } = req.body;
    const result = await service.updateStatus(ids, status, req.user.id);
    return apiResponse.success(res, result, "Status updated successfully");
  });

  optInFromMobile = asyncHandler(async (req, res) => {
    const result = await service.optInFromMobile(req.user.id);
    return apiResponse.success(
      res,
      result,
      "Mobile opt-in successful with catalogues added",
      201
    );
  });

  deleteAllCataloguesByUserId = asyncHandler(async (req, res) => {
    const result = await service.deleteAllCataloguesByUserId(req.user.id);
    return apiResponse.success(
      res,
      result,
      `Successfully deleted ${result.deletedCount} catalogue promotions`
    );
  });

  getAllInfluencerPromotions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, catalogueId } = req.query;

    const filters = {};
    if (status) {
      filters.status = status;
    }
    if (catalogueId) {
      filters.catalogueId = parseInt(catalogueId);
    }

    const pagination = { page, limit };

    const result = await service.getAllInfluencerPromotions(
      filters,
      pagination,
      req.user.id
    );
    return apiResponse.success(
      res,
      result,
      "Influencer promotions retrieved successfully"
    );
  });

  getCataloguesNotInPromotions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const pagination = { page, limit };

    const result = await service.getCataloguesNotInPromotions(
      pagination,
      req.user.id
    );
    return apiResponse.success(
      res,
      result,
      "Catalogues not in promotions retrieved successfully"
    );
  });



becomeInfluencer = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await service.becomeInfluencer(userId);

  return apiResponse.success(
    res,
    result,
    "User is now an influencer"
  );
});


  createReel = asyncHandler(async (req, res) => {
  const influencerId = req.user.id;
  const { contentLink, contentType, catalogueId } = req.body;

  const result = await service.createReel({
    influencerId,
    contentLink,
    contentType,
    catalogueId,
  });

  return apiResponse.success(res, result, "Reel posted successfully", 201);
});
}

module.exports = new InfluencerMarketingController();
