const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.createClaimCategory = async (req, res) => {
  const claimCategory = await service.createClaimCategory(req.body);
  return apiResponse.success(
    res,
    claimCategory,
    "Claim category created successfully",
    201
  );
};

exports.getClaimCategoryById = async (req, res) => {
  const claimCategory = await service.getClaimCategoryById(req.params.id);
  return apiResponse.success(
    res,
    claimCategory,
    "Claim category retrieved successfully"
  );
};

exports.getAllClaimCategories = async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const claimCategories = await service.getAllClaimCategories(includeInactive);
  return apiResponse.success(
    res,
    claimCategories,
    "Claim categories retrieved successfully"
  );
};

exports.getAllClaimCategoriesWithTypes = async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const claimCategories = await service.getAllClaimCategoriesWithTypes(
    includeInactive
  );
  return apiResponse.success(
    res,
    claimCategories,
    "Claim categories with types retrieved successfully"
  );
};

exports.updateClaimCategoryById = async (req, res) => {
  const claimCategory = await service.updateClaimCategoryById(
    req.params.id,
    req.body
  );
  return apiResponse.success(
    res,
    claimCategory,
    "Claim category updated successfully"
  );
};

exports.softDeleteClaimCategoryById = async (req, res) => {
  const result = await service.softDeleteClaimCategoryById(req.params.id);
  return apiResponse.success(
    res,
    result,
    "Claim category deleted successfully"
  );
};

exports.createClaimType = async (req, res) => {
  const claimType = await service.createClaimType(req.body);
  return apiResponse.success(
    res,
    claimType,
    "Claim type created successfully",
    201
  );
};

exports.getClaimTypeById = async (req, res) => {
  const claimType = await service.getClaimTypeById(req.params.id);
  return apiResponse.success(
    res,
    claimType,
    "Claim type retrieved successfully"
  );
};

exports.getAllClaimTypes = async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const claimTypes = await service.getAllClaimTypes(includeInactive);
  return apiResponse.success(
    res,
    claimTypes,
    "Claim types retrieved successfully"
  );
};

exports.getClaimTypesByCategoryId = async (req, res) => {
  const { categoryId } = req.params;
  const includeInactive = req.query.includeInactive === "true";
  const claimTypes = await service.getClaimTypesByCategoryId(
    categoryId,
    includeInactive
  );
  return apiResponse.success(
    res,
    claimTypes,
    "Claim types retrieved successfully"
  );
};

exports.updateClaimTypeById = async (req, res) => {
  const claimType = await service.updateClaimTypeById(req.params.id, req.body);
  return apiResponse.success(res, claimType, "Claim type updated successfully");
};

exports.softDeleteClaimTypeById = async (req, res) => {
  const result = await service.softDeleteClaimTypeById(req.params.id);
  return apiResponse.success(res, result, "Claim type deleted successfully");
};

exports.createClaim = async (req, res) => {
  const claim = await service.createClaim(
    req.body,
    req.user.id,
    req.body.evidence || []
  );
  return apiResponse.success(res, claim, "Claim created successfully", 201);
};

exports.getClaimById = async (req, res) => {
  const claim = await service.getClaimById(
    req.params.id,
    req.user.id,
    req.user.role === "admin"
  );
  return apiResponse.success(res, claim, "Claim retrieved successfully");
};

exports.getClaimsByUserId = async (req, res) => {
  const filters = {};
  const pagination = {};

  if (req.query.status) filters.status = req.query.status;
  if (req.query.claimTypeId) filters.claimTypeId = req.query.claimTypeId;
  if (req.query.priority) filters.priority = req.query.priority;

  if (req.query.page) pagination.page = parseInt(req.query.page);
  if (req.query.limit) pagination.limit = parseInt(req.query.limit);

  const result = await service.getClaimsByUserId(
    req.user.id,
    filters,
    pagination
  );
  return apiResponse.success(res, result, "Claims retrieved successfully");
};

exports.getAllClaims = async (req, res) => {
  const filters = {};
  const pagination = {};

  if (req.query.status) filters.status = req.query.status;
  if (req.query.claimTypeId) filters.claimTypeId = req.query.claimTypeId;
  if (req.query.userId) filters.userId = req.query.userId;
  if (req.query.priority) filters.priority = req.query.priority;
  if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
  if (req.query.dateTo) filters.dateTo = req.query.dateTo;

  if (req.query.page) pagination.page = req.query.page;
  if (req.query.limit) pagination.limit = req.query.limit;

  const claims = await service.getAllClaims(filters, pagination);
  return apiResponse.success(res, claims, "Claims retrieved successfully");
};

exports.updateClaimById = async (req, res) => {
  const claim = await service.updateClaimById(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role === "admin"
  );
  return apiResponse.success(res, claim, "Claim updated successfully");
};

exports.softDeleteClaimById = async (req, res) => {
  const result = await service.softDeleteClaimById(
    req.params.id,
    req.user.id,
    req.user.role === "admin"
  );
  return apiResponse.success(res, result, "Claim deleted successfully");
};

exports.addClaimEvidence = async (req, res) => {
  const evidence = await service.addClaimEvidence(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role === "admin"
  );
  return apiResponse.success(res, evidence, "Evidence added successfully", 201);
};

exports.deleteClaimEvidence = async (req, res) => {
  const result = await service.deleteClaimEvidence(
    req.params.evidenceId,
    req.user.id,
    req.user.role === "admin"
  );
  return apiResponse.success(res, result, "Evidence deleted successfully");
};

exports.addClaimResponse = async (req, res) => {
  const response = await service.addClaimResponse(
    req.params.id,
    req.body,
    req.user.id
  );
  return apiResponse.success(res, response, "Response added successfully", 201);
};

exports.deleteClaimResponse = async (req, res) => {
  const result = await service.deleteClaimResponse(
    req.params.responseId,
    req.user.id,
    req.user.role === "admin"
  );
  return apiResponse.success(res, result, "Response deleted successfully");
};

exports.getClaimStatistics = async (req, res) => {
  const filters = {};
  if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
  if (req.query.dateTo) filters.dateTo = req.query.dateTo;

  const statistics = await service.getClaimStatistics(
    filters,
    req.user.id,
    req.user.role === "admin"
  );
  return apiResponse.success(
    res,
    statistics,
    "Claim statistics retrieved successfully"
  );
};

exports.generatePresignedUrl = async (req, res) => {
  const { fileName, contentType } = req.body;
  const presignedUrlData = await service.generatePresignedUrl(
    fileName,
    contentType,
    req.user.id
  );
  return apiResponse.success(
    res,
    presignedUrlData,
    "Presigned URL generated successfully"
  );
};
