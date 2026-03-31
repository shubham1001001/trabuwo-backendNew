const { PolicyType, Policy, PolicyVersion, UserAgreement } = require("./model");

const POLICY_ATTRIBUTES = ["id", "publicId", "slug", "displayName", "policyTypeId"];
const POLICY_VERSION_ATTRIBUTES = [
  "id",
  "publicId",
  "policyId",
  "contentMarkdown",
  "versionNumber",
  "isActive",
  "createdAt",
];
const USER_AGREEMENT_ATTRIBUTES = [
  "id",
  "publicId",
  "userId",
  "versionId",
  "agreedAt",
  "ipAddress",
];

exports.findActivePolicyTypes = (options = {}) => {
  return PolicyType.findAll({
    where: { isActive: true },
    ...options,
  });
};

exports.findPolicyTypeByCode = (code, options = {}) => {
  return PolicyType.findOne({
    where: { code },
    ...options,
  });
};

exports.createPolicy = (data, options = {}) => {
  return Policy.create(data, { ...options, returning: true });
};

exports.updatePolicyById = (id, data, options = {}) => {
  return Policy.update(data, { where: { id }, ...options });
};

exports.findPolicyByPublicId = (publicId, options = {}) => {
  return Policy.findOne({
    where: { publicId },
    attributes: POLICY_ATTRIBUTES,
    ...options,
  });
};

exports.findPolicyBySlug = (slug, options = {}) => {
  return Policy.findOne({
    where: { slug },
    attributes: POLICY_ATTRIBUTES,
    ...options,
  });
};

exports.listPoliciesWithActiveVersion = (options = {}) => {
  const { limit, offset } = options;

  return Policy.findAndCountAll({
    attributes: POLICY_ATTRIBUTES,
    include: [
      {
        model: PolicyVersion,
        as: "versions",
        where: { isActive: true },
        required: false,
        attributes: POLICY_VERSION_ATTRIBUTES,
      },
      {
        model: PolicyType,
        as: "policyType",
      },
    ],
    order: [["id", "ASC"]],
    limit,
    offset,
  });
};

exports.createPolicyVersion = (data, options = {}) => {
  return PolicyVersion.create(data, { ...options, returning: true });
};

exports.deactivatePolicyVersions = (policyId, options = {}) => {
  return PolicyVersion.update(
    { isActive: false },
    {
      where: { policyId, isActive: true },
      ...options,
    }
  );
};

exports.findActiveVersionByPolicyId = (policyId, options = {}) => {
  return PolicyVersion.findOne({
    where: { policyId, isActive: true },
    attributes: POLICY_VERSION_ATTRIBUTES,
    ...options,
  });
};

exports.listVersionsByPolicyId = (policyId, options = {}) => {
  const { limit, offset } = options;

  return PolicyVersion.findAndCountAll({
    where: { policyId },
    attributes: POLICY_VERSION_ATTRIBUTES,
    order: [
      ["versionNumber", "DESC"],
      ["id", "DESC"],
    ],
    limit,
    offset,
  });
};

exports.findVersionByPublicId = (publicId, options = {}) => {
  return PolicyVersion.findOne({
    where: { publicId },
    attributes: POLICY_VERSION_ATTRIBUTES,
    ...options,
  });
};

exports.createUserAgreement = (data, options = {}) => {
  return UserAgreement.create(data, { ...options, returning: true });
};

exports.bulkCreateUserAgreements = (rows, options = {}) => {
  if (!rows || rows.length === 0) {
    return Promise.resolve([]);
  }

  return UserAgreement.bulkCreate(rows, {
    ...options,
    returning: true,
  });
};

exports.findAgreementByUserAndVersion = (userId, versionId, options = {}) => {
  return UserAgreement.findOne({
    where: { userId, versionId },
    attributes: USER_AGREEMENT_ATTRIBUTES,
    ...options,
  });
};

exports.listAgreementsForUser = (userId, options = {}) => {
  const { limit, offset } = options;

  return UserAgreement.findAndCountAll({
    where: { userId },
    attributes: USER_AGREEMENT_ATTRIBUTES,
    include: [
      {
        model: PolicyVersion,
        as: "version",
        attributes: POLICY_VERSION_ATTRIBUTES,
        include: [
          {
            model: Policy,
            as: "policy",
            attributes: POLICY_ATTRIBUTES,
          },
        ],
      },
    ],
    order: [["agreedAt", "DESC"]],
    limit,
    offset,
  });
};

exports.listPolicyTypes = (options = {}) => {
  const { limit, offset } = options;

  return PolicyType.findAndCountAll({
    where: { is_active: true },
    attributes: ["id", "code", "displayName"],
    order: [["createdAt", "ASC"]],
    limit,
    offset,
  });
};


exports.findActivePolicyByTypeCode = (code) => {
  return Policy.findOne({
    attributes: ["id", "publicId", "slug", "displayName"],
    include: [
      {
        model: PolicyType,
        as: "policyType",
        where: { code }, 
        attributes: ["id", "code", "displayName"],
      },
      {
        model: PolicyVersion,
        as: "versions",
        where: { isActive: true },
        required: true, 
        attributes: [
          "id",
          "publicId",
          "versionNumber",
          "contentMarkdown",
          "createdAt",
        ],
      },
    ],
  });
};