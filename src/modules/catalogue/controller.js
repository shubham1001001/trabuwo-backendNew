const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const { findUserByPublicId } = require("../auth/dao");
const { NotFoundError } = require("../../utils/errors");

exports.createCatalogue = async (req, res) => {
  const catalogue = await service.createCatalogue(req.body, req.user.id);
  return apiResponse.success(res, catalogue, "Catalogue created", 201);
};

exports.getCatalogueById = async (req, res) => {
  const catalogue = await service.getCatalogueById(req.params.id);
  const sellerStats = await service.getSellerStatsByUserId(catalogue.userId);
  catalogue.setDataValue("sellerStats", sellerStats);
  return apiResponse.success(res, catalogue);
};

exports.getCatalogueList = async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    search,
  };

  const catalogues = await service.getCataloguesByUserId(req.user.id, options);

  return apiResponse.success(res, catalogues);
};

exports.getCataloguesBySellerPublicId = async (req, res) => {
  const { sellerPublicId } = req.params;
  const { page = 1, limit = 10, status, search } = req.query;

  const seller = await findUserByPublicId(sellerPublicId);
  if (!seller) {
    throw new NotFoundError("Seller not found");
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    search,
    wishlistUserId: req.user?.id || null,
  };

  const catalogues = await service.getCataloguesByUserId(seller.id, options);

  return apiResponse.success(res, catalogues);
};

exports.updateCatalogue = async (req, res) => {
  await service.updateCatalogueById(req.params.id, req.body, req.user.id);
  return apiResponse.success(res, null, "Catalogue updated");
};

exports.deleteCatalogue = async (req, res) => {
  await service.softDeleteCatalogueById(req.params.id, req.user.id);
  return apiResponse.success(res, null, "Catalogue deleted");
};

exports.submitCatalogueForQC = async (req, res) => {
  await service.submitCatalogueForQC(req.params.id, req.user.id);
  return apiResponse.success(res, null, "Catalogue submitted for QC");
};

exports.updateQCStatus = async (req, res) => {
  await service.updateQCStatus(
    req.params.id,
    req.body.status,
    req.body.qcNotes
  );
  return apiResponse.success(res, null, "QC status updated");
};

exports.getCataloguesByStatus = async (req, res) => {
  const { page = 1, limit = 10, startDate, endDate, categoryId } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    startDate,
    endDate,
    categoryId: categoryId ? parseInt(categoryId) : undefined,
  };

  const catalogues = await service.getCataloguesByStatus(
    req.params.status,
    options
  );
  return apiResponse.success(res, catalogues);
};

exports.getQcErrorCount = async (req, res) => {
  const qcErrorData = await service.getQcErrorCountData();
  return apiResponse.success(res, qcErrorData);
};

exports.getCatalogueStatusCounts = async (req, res) => {
  const statusCountsData = await service.getCatalogueStatusCountsData();
  return apiResponse.success(res, statusCountsData);
};

exports.searchMinimalCatalogues = async (req, res) => {
  const { q } = req.query;

  const catalogues = await service.searchMinimalCatalogues({
    search: q,
  });

  return apiResponse.success(res, { catalogues });
};

exports.getAllCataloguesWithKeysetPagination = async (req, res) => {
  const { cursor, limit, search, personalize, sortBy, ...filters } = req.query;

  const options = {
    cursor,
    limit: limit || 20,
    search,
    personalize: personalize === "true",
    userId: req.user?.id || null,
    sortBy,
    ...filters,
  };

  const result = await service.getAllCataloguesWithKeysetPagination(options);
  return apiResponse.success(res, result);
};

exports.getMyCatalogues = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
  };

  const catalogues = await service.getMyCatalogues(req.user.id, options);
  return apiResponse.success(res, catalogues);
};
