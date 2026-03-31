const sequelize = require("../../config/database");
const dao = require("./dao");
const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../../utils/errors");

const toPolicyDto = (policy, activeVersion) => {
  if (!policy) {
    return null;
  }

  return {
    publicId: policy.publicId,
    slug: policy.slug,
    displayName: policy.displayName,
    policyType: policy.policyType
      ? {
          code: policy.policyType.code,
          displayName: policy.policyType.displayName,
        }
      : null,
    activeVersion: activeVersion
      ? {
          publicId: activeVersion.publicId,
          versionNumber: activeVersion.versionNumber,
          isActive: activeVersion.isActive,
          contentMarkdown: activeVersion.contentMarkdown,
          createdAt: activeVersion.createdAt,
        }
      : null,
  };
};

const toAgreementDto = (agreement) => {
  if (!agreement) {
    return null;
  }

  const version = agreement.version;
  const policy = version?.policy;

  return {
    publicId: agreement.publicId,
    agreedAt: agreement.agreedAt,
    ipAddress: agreement.ipAddress,
    version: version
      ? {
          publicId: version.publicId,
          versionNumber: version.versionNumber,
          isActive: version.isActive,
          createdAt: version.createdAt,
        }
      : null,
    policy: policy
      ? {
          publicId: policy.publicId,
          slug: policy.slug,
          displayName: policy.displayName,
        }
      : null,
  };
};

exports.createPolicy = async ({ slug, displayName, policyTypeCode }) => {
  const policyType = await dao.findPolicyTypeByCode(policyTypeCode);
  if (!policyType || !policyType.isActive) {
    throw new ValidationError("Invalid or inactive policy type code", {
      policyTypeCode,
    });
  }

  const existing = await dao.findPolicyBySlug(slug);
  if (existing) {
    throw new ConflictError("Policy with this slug already exists", { slug });
  }

  const created = await dao.createPolicy({
    slug,
    displayName,
    policyTypeId: policyType.id,
  });

  return toPolicyDto(created, null);
};

exports.updatePolicy = async (publicId, { displayName, policyTypeCode }) => {
  const policy = await dao.findPolicyByPublicId(publicId);
  if (!policy) {
    throw new NotFoundError("Policy not found");
  }

  const updatePayload = {};

  if (displayName !== undefined) {
    updatePayload.displayName = displayName;
  }

  if (policyTypeCode !== undefined) {
    const policyType = await dao.findPolicyTypeByCode(policyTypeCode);
    if (!policyType || !policyType.isActive) {
      throw new ValidationError("Invalid or inactive policy type code", {
        policyTypeCode,
      });
    }
    updatePayload.policyTypeId = policyType.id;
  }

  if (Object.keys(updatePayload).length === 0) {
    return toPolicyDto(policy, null);
  }

  await dao.updatePolicyById(policy.id, updatePayload);

  const updated = await dao.findPolicyByPublicId(publicId);
  return toPolicyDto(updated, null);
};

exports.listPolicies = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const { rows, count } = await dao.listPoliciesWithActiveVersion({
    limit,
    offset,
  });

  const data = rows.map((row) => {
    const activeVersion =
      Array.isArray(row.versions) && row.versions.length > 0
        ? row.versions[0]
        : null;
    return toPolicyDto(row, activeVersion);
  });

  return {
    policies: data,
    pagination: {
      currentPage: page,
      total: count,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

exports.getPolicyByPublicId = async (publicId, { page = 1, limit = 20 }) => {
  const policy = await dao.findPolicyByPublicId(publicId);
  if (!policy) {
    throw new NotFoundError("Policy not found");
  }

  const offset = (page - 1) * limit;
  const { rows, count } = await dao.listVersionsByPolicyId(policy.id, {
    limit,
    offset,
  });

  return {
    policy: {
      publicId: policy.publicId,
      slug: policy.slug,
      displayName: policy.displayName,
    },
    versions: rows.map((v) => ({
      publicId: v.publicId,
      versionNumber: v.versionNumber,
      isActive: v.isActive,
      contentMarkdown: v.contentMarkdown,
      createdAt: v.createdAt,
    })),
    pagination: {
      currentPage: page,
      total: count,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

exports.createPolicyVersion = async (
  policyPublicId,
  { contentMarkdown, makeActive = false }
) => {
  const policy = await dao.findPolicyByPublicId(policyPublicId);
  if (!policy) {
    throw new NotFoundError("Policy not found");
  }

  return sequelize.transaction(async (transaction) => {
    const existingActive = await dao.findActiveVersionByPolicyId(policy.id, {
      transaction,
    });

    const nextVersionNumber = existingActive
      ? existingActive.versionNumber + 1
      : 1;

    if (makeActive && existingActive) {
      await dao.deactivatePolicyVersions(policy.id, { transaction });
    }

    const created = await dao.createPolicyVersion(
      {
        policyId: policy.id,
        contentMarkdown,
        versionNumber: nextVersionNumber,
        isActive: Boolean(makeActive),
      },
      { transaction }
    );

    return {
      policy: {
        publicId: policy.publicId,
        slug: policy.slug,
        displayName: policy.displayName,
      },
      version: {
        publicId: created.publicId,
        versionNumber: created.versionNumber,
        isActive: created.isActive,
        contentMarkdown: created.contentMarkdown,
        createdAt: created.createdAt,
      },
    };
  });
};

exports.getActivePolicies = async () => {
  const { policies } = await exports.listPolicies({ page: 1, limit: 1000 });
  return policies.filter((p) => p.activeVersion && p.activeVersion.isActive);
};

exports.recordUserAgreement = async (userId, { versionPublicId, ipAddress }) => {
  const version = await dao.findVersionByPublicId(versionPublicId);
  if (!version || !version.isActive) {
    throw new ValidationError("Version not found or not active", {
      versionPublicId,
    });
  }

  const existing = await dao.findAgreementByUserAndVersion(userId, version.id);
  if (existing) {
    return toAgreementDto(existing);
  }

  const created = await dao.createUserAgreement({
    userId,
    versionId: version.id,
    ipAddress: ipAddress || null,
  });

  const withRelations = await dao.listAgreementsForUser(userId, {
    limit: 1,
    offset: 0,
  });

  const latest = withRelations.rows.find(
    (a) => a.id === created.id || a.publicId === created.publicId
  );

  return toAgreementDto(latest || created);
};

exports.listUserAgreements = async (userId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const { rows, count } = await dao.listAgreementsForUser(userId, {
    limit,
    offset,
  });

  return {
    agreements: rows.map(toAgreementDto),
    pagination: {
      currentPage: page,
      total: count,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};


const toPolicyTypeDto = (data) => ({
  id: data.id,
  code: data.code,
  displayName: data.displayName,
});
exports.listPolicyTypes = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const { rows, count } = await dao.listPolicyTypes({
    limit,
    offset,
  });

  return {
    policyTypes: rows.map(toPolicyTypeDto),
    pagination: {
      currentPage: page,
      total: count,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};






exports.getActivePolicyByType = async (code) => {
  return await dao.findActivePolicyByTypeCode(code);
};