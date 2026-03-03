const {
  ClaimCategory,
  ClaimType,
  Claim,
  ClaimEvidence,
  ClaimResponse,
} = require("./model");
const sequelize = require("../../config/database");
const { Op } = require("sequelize");

exports.createClaimCategory = async (data) => {
  return await ClaimCategory.create(data);
};

exports.getClaimCategoryById = async (id) => {
  return await ClaimCategory.findOne({
    where: { id, isDeleted: false },
  });
};

exports.getAllClaimCategories = async (includeInactive = false) => {
  const where = { isDeleted: false };
  if (!includeInactive) {
    where.isActive = true;
  }

  return await ClaimCategory.findAll({
    where,
    order: [["name", "ASC"]],
  });
};

exports.getAllClaimCategoriesWithTypes = async (includeInactive = false) => {
  const where = { isDeleted: false };
  if (!includeInactive) {
    where.isActive = true;
  }

  return await ClaimCategory.findAll({
    where,
    include: [
      {
        model: ClaimType,
        as: "claimTypes",
        where: {
          isDeleted: false,
          ...(includeInactive ? {} : { isActive: true }),
        },
        required: false,
        attributes: ["id", "name", "description", "isActive"],
        order: [["name", "ASC"]],
      },
    ],
    order: [["name", "ASC"]],
  });
};

exports.updateClaimCategoryById = async (id, data) => {
  const [updatedRows] = await ClaimCategory.update(data, {
    where: { id, isDeleted: false },
  });
  return updatedRows > 0;
};

exports.softDeleteClaimCategoryById = async (id) => {
  const claimTypesCount = await ClaimType.count({
    where: { categoryId: id, isDeleted: false },
  });

  if (claimTypesCount > 0) {
    throw new Error("Cannot delete category with existing claim types");
  }

  const [updatedRows] = await ClaimCategory.update(
    { isDeleted: true },
    { where: { id, isDeleted: false } }
  );
  return updatedRows > 0;
};

exports.createClaimType = async (data) => {
  return await ClaimType.create(data);
};

exports.getClaimTypeById = async (id) => {
  return await ClaimType.findOne({
    where: { id, isDeleted: false },
    include: [
      {
        model: ClaimCategory,
        as: "category",
        attributes: ["id", "name"],
      },
    ],
  });
};

exports.getAllClaimTypes = async (includeInactive = false) => {
  const where = { isDeleted: false };
  if (!includeInactive) {
    where.isActive = true;
  }

  return await ClaimType.findAll({
    where,
    include: [
      {
        model: ClaimCategory,
        as: "category",
        attributes: ["id", "name"],
      },
    ],
    order: [["name", "ASC"]],
  });
};

exports.getClaimTypesByCategoryId = async (
  categoryId,
  includeInactive = false
) => {
  const where = { categoryId, isDeleted: false };
  if (!includeInactive) {
    where.isActive = true;
  }

  return await ClaimType.findAll({
    where,
    order: [["name", "ASC"]],
  });
};

exports.updateClaimTypeById = async (id, data) => {
  const [updatedRows] = await ClaimType.update(data, {
    where: { id, isDeleted: false },
  });
  return updatedRows > 0;
};

exports.softDeleteClaimTypeById = async (id) => {
  const claimsCount = await Claim.count({
    where: { claimTypeId: id, isDeleted: false },
  });

  if (claimsCount > 0) {
    throw new Error("Cannot delete claim type with existing claims");
  }

  const [updatedRows] = await ClaimType.update(
    { isDeleted: true },
    { where: { id, isDeleted: false } }
  );
  return updatedRows > 0;
};

exports.createClaim = async (data) => {
  return await Claim.create(data);
};

exports.getClaimById = async (id, includeRelations = false) => {
  const include = [];

  if (includeRelations) {
    include.push(
      {
        model: ClaimType,
        as: "claimType",
        include: [
          {
            model: ClaimCategory,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
        attributes: ["id", "name", "description"],
      },
      {
        model: ClaimEvidence,
        as: "evidence",
        where: { isDeleted: false },
        required: false,
        order: [["createdAt", "ASC"]],
      },
      {
        model: ClaimResponse,
        as: "responses",
        where: { isDeleted: false },
        required: false,
        order: [["createdAt", "ASC"]],
      }
    );
  }

  return await Claim.findOne({
    where: { id, isDeleted: false },
    include,
  });
};

exports.getClaimsByUserId = async (userId, filters = {}, pagination = {}) => {
  const where = { userId, isDeleted: false };
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.claimTypeId) {
    where.claimTypeId = filters.claimTypeId;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  // Get total count without includes to avoid counting joined rows
  const totalCount = await Claim.count({
    where,
  });

  // Get the actual records with includes
  const claims = await Claim.findAll({
    where,
    include: [
      {
        model: ClaimType,
        as: "claimType",
        include: [
          {
            model: ClaimCategory,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
        attributes: ["id", "name", "description"],
      },
      {
        model: ClaimEvidence,
        as: "evidence",
        where: { isDeleted: false },
        required: false,
        limit: 5,
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    claims,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPreviousPage: page > 1,
    },
  };
};

exports.getAllClaims = async (filters = {}, pagination = {}) => {
  const where = { isDeleted: false };
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.claimTypeId) {
    where.claimTypeId = filters.claimTypeId;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.dateFrom) {
    where.createdAt = {
      [Op.gte]: new Date(filters.dateFrom),
    };
  }

  if (filters.dateTo) {
    where.createdAt = {
      ...where.createdAt,
      [Op.lte]: new Date(filters.dateTo),
    };
  }

  // Get total count without includes to avoid counting joined rows
  const totalCount = await Claim.count({
    where,
  });

  // Get the actual records with includes
  const claims = await Claim.findAll({
    where,
    include: [
      {
        model: ClaimType,
        as: "claimType",
        include: [
          {
            model: ClaimCategory,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
        attributes: ["id", "name", "description"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  return {
    claims,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

exports.updateClaimById = async (id, data) => {
  const [updatedRows] = await Claim.update(data, {
    where: { id, isDeleted: false },
  });
  return updatedRows > 0;
};

exports.softDeleteClaimById = async (id) => {
  const [updatedRows] = await Claim.update(
    { isDeleted: true },
    { where: { id, isDeleted: false } }
  );
  return updatedRows > 0;
};

exports.createClaimEvidence = async (evidenceData) => {
  return await ClaimEvidence.create(evidenceData);
};

exports.bulkCreateClaimEvidence = async (evidenceArray) => {
  return await ClaimEvidence.bulkCreate(evidenceArray);
};

exports.getClaimEvidenceByClaimId = async (claimId) => {
  return await ClaimEvidence.findAll({
    where: { claimId, isDeleted: false },
    order: [["createdAt", "ASC"]],
  });
};

exports.deleteClaimEvidenceById = async (id) => {
  const [updatedRows] = await ClaimEvidence.update(
    { isDeleted: true },
    { where: { id, isDeleted: false } }
  );
  return updatedRows > 0;
};

exports.getClaimEvidenceById = async (id) => {
  return await ClaimEvidence.findOne({
    where: { id, isDeleted: false },
    include: [{ model: Claim, as: "claim" }],
  });
};

exports.createClaimResponse = async (responseData) => {
  return await ClaimResponse.create(responseData);
};

exports.getClaimResponsesByClaimId = async (claimId) => {
  return await ClaimResponse.findAll({
    where: { claimId, isDeleted: false },
    order: [["createdAt", "ASC"]],
  });
};

exports.deleteClaimResponseById = async (id) => {
  const [updatedRows] = await ClaimResponse.update(
    { isDeleted: true },
    { where: { id, isDeleted: false } }
  );
  return updatedRows > 0;
};

exports.getClaimResponseById = async (id) => {
  return await ClaimResponse.findOne({
    where: { id, isDeleted: false },
    include: [{ model: Claim, as: "claim" }],
  });
};

exports.getClaimStatistics = async (filters = {}) => {
  const where = { isDeleted: false };

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.dateFrom) {
    where.createdAt = {
      [Op.gte]: new Date(filters.dateFrom),
    };
  }

  if (filters.dateTo) {
    where.createdAt = {
      ...where.createdAt,
      [Op.lte]: new Date(filters.dateTo),
    };
  }

  const stats = await Claim.findOne({
    attributes: [
      [sequelize.fn("COUNT", sequelize.col("id")), "total"],
      [
        sequelize.fn(
          "COUNT",
          sequelize.literal("CASE WHEN status = 'open' THEN 1 END")
        ),
        "open",
      ],
      [
        sequelize.fn(
          "COUNT",
          sequelize.literal("CASE WHEN status = 'in_progress' THEN 1 END")
        ),
        "inProgress",
      ],
      [
        sequelize.fn(
          "COUNT",
          sequelize.literal("CASE WHEN status = 'resolved' THEN 1 END")
        ),
        "resolved",
      ],
      [
        sequelize.fn(
          "COUNT",
          sequelize.literal("CASE WHEN status = 'closed' THEN 1 END")
        ),
        "closed",
      ],
    ],
    where,
    raw: true,
  });

  return {
    total: parseInt(stats.total) || 0,
    open: parseInt(stats.open) || 0,
    inProgress: parseInt(stats.inProgress) || 0,
    resolved: parseInt(stats.resolved) || 0,
    closed: parseInt(stats.closed) || 0,
  };
};
