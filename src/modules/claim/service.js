const dao = require("./dao");
const s3Service = require("../../services/s3");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  ResourceCreationError,
} = require("../../utils/errors");
const { REQUIRED_EVIDENCE_TYPES } = require("./constants");

exports.createClaimCategory = async (data) => {
  const claimCategory = await dao.createClaimCategory(data);
  if (!claimCategory) {
    throw new ResourceCreationError("Failed to create claim category");
  }
  return claimCategory;
};

exports.getClaimCategoryById = async (id) => {
  const claimCategory = await dao.getClaimCategoryById(id);
  if (!claimCategory) {
    throw new NotFoundError("Claim category not found");
  }
  return claimCategory;
};

exports.getAllClaimCategories = async (includeInactive = false) => {
  return await dao.getAllClaimCategories(includeInactive);
};

exports.getAllClaimCategoriesWithTypes = async (includeInactive = false) => {
  return await dao.getAllClaimCategoriesWithTypes(includeInactive);
};

exports.updateClaimCategoryById = async (id, data) => {
  const claimCategory = await dao.getClaimCategoryById(id);
  if (!claimCategory) {
    throw new NotFoundError("Claim category not found");
  }

  const updated = await dao.updateClaimCategoryById(id, data);
  if (!updated) {
    throw new ResourceCreationError("Failed to update claim category");
  }

  return await dao.getClaimCategoryById(id);
};

exports.softDeleteClaimCategoryById = async (id) => {
  try {
    const deleted = await dao.softDeleteClaimCategoryById(id);
    if (!deleted) {
      throw new ResourceCreationError("Failed to delete claim category");
    }
    return { message: "Claim category deleted successfully" };
  } catch (error) {
    if (error.message.includes("Cannot delete category")) {
      throw new ConflictError(error.message);
    }
    throw error;
  }
};

exports.createClaimType = async (data) => {
  const category = await dao.getClaimCategoryById(data.categoryId);
  if (!category) {
    throw new ValidationError("Invalid claim category ID");
  }

  const claimType = await dao.createClaimType(data);
  if (!claimType) {
    throw new ResourceCreationError("Failed to create claim type");
  }
  return claimType;
};

exports.getClaimTypeById = async (id) => {
  const claimType = await dao.getClaimTypeById(id);
  if (!claimType) {
    throw new NotFoundError("Claim type not found");
  }
  return claimType;
};

exports.getAllClaimTypes = async (includeInactive = false) => {
  return await dao.getAllClaimTypes(includeInactive);
};

exports.getClaimTypesByCategoryId = async (
  categoryId,
  includeInactive = false
) => {
  const category = await dao.getClaimCategoryById(categoryId);
  if (!category) {
    throw new NotFoundError("Claim category not found");
  }

  return await dao.getClaimTypesByCategoryId(categoryId, includeInactive);
};

exports.updateClaimTypeById = async (id, data) => {
  const claimType = await dao.getClaimTypeById(id);
  if (!claimType) {
    throw new NotFoundError("Claim type not found");
  }

  if (data.categoryId) {
    const category = await dao.getClaimCategoryById(data.categoryId);
    if (!category) {
      throw new ValidationError("Invalid claim category ID");
    }
  }

  const updated = await dao.updateClaimTypeById(id, data);
  if (!updated) {
    throw new ResourceCreationError("Failed to update claim type");
  }

  return await dao.getClaimTypeById(id);
};

exports.softDeleteClaimTypeById = async (id) => {
  try {
    const deleted = await dao.softDeleteClaimTypeById(id);
    if (!deleted) {
      throw new ResourceCreationError("Failed to delete claim type");
    }
    return { message: "Claim type deleted successfully" };
  } catch (error) {
    if (error.message.includes("Cannot delete claim type")) {
      throw new ConflictError(error.message);
    }
    throw error;
  }
};

exports.createClaim = async (data, userId, evidenceArray = []) => {
  const uploadedEvidenceTypes = evidenceArray.map((e) => e.evidenceType);
  const missingRequiredEvidence = REQUIRED_EVIDENCE_TYPES.filter(
    (type) => !uploadedEvidenceTypes.includes(type)
  );

  if (missingRequiredEvidence.length > 0) {
    throw new ValidationError(
      `Missing required evidence: ${missingRequiredEvidence.join(", ")}`
    );
  }

  const claimType = await dao.getClaimTypeById(data.claimTypeId);
  if (!claimType) {
    throw new ValidationError("Invalid claim type ID");
  }

  const claimData = {
    ...data,
    userId,
  };

  const claim = await dao.createClaim(claimData);
  if (!claim) {
    throw new ResourceCreationError("Failed to create claim");
  }

  if (evidenceArray.length > 0) {
    const evidenceData = evidenceArray.map((e) => ({
      claimId: claim.id,
      evidenceType: e.evidenceType,
      fileUrl: e.fileUrl,
      fileKey: e.fileKey,
      fileName: e.fileName,
      fileSize: e.fileSize,
      mimeType: e.mimeType,
      isRequired: REQUIRED_EVIDENCE_TYPES.includes(e.evidenceType),
    }));

    await dao.bulkCreateClaimEvidence(evidenceData);
  }

  return await dao.getClaimById(claim.id, true);
};

exports.getClaimById = async (claimId, userId, isAdmin = false) => {
  const claim = await dao.getClaimById(claimId, true);
  if (!claim) {
    throw new NotFoundError("Claim not found");
  }

  if (!isAdmin && claim.userId !== userId) {
    throw new ConflictError("You can only view your own claims");
  }

  return claim;
};

exports.getClaimsByUserId = async (userId, filters = {}, pagination = {}) => {
  return await dao.getClaimsByUserId(userId, filters, pagination);
};

exports.getAllClaims = async (filters = {}, pagination = {}) => {
  return await dao.getAllClaims(filters, pagination);
};

exports.updateClaimById = async (id, data, userId, isAdmin = false) => {
  const claim = await dao.getClaimById(id, false);
  if (!claim) {
    throw new NotFoundError("Claim not found");
  }

  if (!isAdmin && claim.userId !== userId) {
    throw new ConflictError("You can only update your own claims");
  }

  if (!isAdmin && ["resolved", "closed"].includes(claim.status)) {
    throw new ConflictError("Cannot update resolved or closed claims");
  }

  const updated = await dao.updateClaimById(id, data);
  if (!updated) {
    throw new ResourceCreationError("Failed to update claim");
  }

  return await dao.getClaimById(id, true);
};

exports.softDeleteClaimById = async (id, userId, isAdmin = false) => {
  const claim = await dao.getClaimById(id, false);
  if (!claim) {
    throw new NotFoundError("Claim not found");
  }

  if (!isAdmin && claim.userId !== userId) {
    throw new ConflictError("You can only delete your own claims");
  }

  const deleted = await dao.softDeleteClaimById(id);
  if (!deleted) {
    throw new ResourceCreationError("Failed to delete claim");
  }

  return { message: "Claim deleted successfully" };
};

exports.addClaimEvidence = async (
  claimId,
  evidenceData,
  userId,
  isAdmin = false
) => {
  const claim = await dao.getClaimById(claimId, false);
  if (!claim) {
    throw new NotFoundError("Claim not found");
  }

  if (!isAdmin && claim.userId !== userId) {
    throw new ConflictError("You can only add evidence to your own claims");
  }

  const evidence = await dao.createClaimEvidence({
    ...evidenceData,
    claimId,
  });

  return evidence;
};

exports.deleteClaimEvidence = async (evidenceId, userId, isAdmin = false) => {
  const evidence = await dao.getClaimEvidenceById(evidenceId);
  if (!evidence) {
    throw new NotFoundError("Evidence not found");
  }

  const claim = await dao.getClaimById(evidence.claimId, false);
  if (!isAdmin && claim.userId !== userId) {
    throw new ConflictError(
      "You can only delete evidence from your own claims"
    );
  }

  const deleted = await dao.deleteClaimEvidenceById(evidenceId);
  if (!deleted) {
    throw new ResourceCreationError("Failed to delete evidence");
  }

  return { message: "Evidence deleted successfully" };
};

exports.addClaimResponse = async (claimId, responseData, userId) => {
  const claim = await dao.getClaimById(claimId, false);
  if (!claim) {
    throw new NotFoundError("Claim not found");
  }

  const response = await dao.createClaimResponse({
    ...responseData,
    claimId,
    userId,
  });

  return response;
};

exports.deleteClaimResponse = async (responseId, userId, isAdmin = false) => {
  const response = await dao.getClaimResponseById(responseId);
  if (!response) {
    throw new NotFoundError("Response not found");
  }

  if (!isAdmin && response.userId !== userId) {
    throw new ConflictError("You can only delete your own responses");
  }

  const deleted = await dao.deleteClaimResponseById(responseId);
  if (!deleted) {
    throw new ResourceCreationError("Failed to delete response");
  }

  return { message: "Response deleted successfully" };
};

exports.getClaimStatistics = async (
  filters = {},
  userId = null,
  isAdmin = false
) => {
  if (!isAdmin && userId) {
    filters.userId = userId;
  }

  return await dao.getClaimStatistics(filters);
};

exports.generatePresignedUrl = async (fileName, contentType, userId) => {
  try {
    const result = await s3Service.generatePresignedUrl(
      fileName,
      contentType,
      userId,
      "claim_evidence"
    );

    return result;
  } catch {
    throw new ResourceCreationError("Failed to generate presigned URL");
  }
};
