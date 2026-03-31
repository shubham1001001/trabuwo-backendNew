const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.createPolicy = async (req, res) => {
  const { slug, displayName, policyTypeCode } = req.body;

  const policy = await service.createPolicy({
    slug,
    displayName,
    policyTypeCode,
  });

  return apiResponse.success(
    res,
    policy,
    "Policy created successfully",
    201
  );
};

exports.updatePolicy = async (req, res) => {
  const { publicId } = req.params;
  const { displayName, policyTypeCode } = req.body;

  const policy = await service.updatePolicy(publicId, {
    displayName,
    policyTypeCode,
  });

  return apiResponse.success(res, policy, "Policy updated successfully");
};

exports.listPolicies = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await service.listPolicies({
    page: Number(page),
    limit: Number(limit),
  });

  return apiResponse.success(
    res,
    result,
    "Policies fetched successfully"
  );
};

exports.getPolicyByPublicId = async (req, res) => {
  const { publicId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const result = await service.getPolicyByPublicId(publicId, {
    page: Number(page),
    limit: Number(limit),
  });

  return apiResponse.success(
    res,
    result,
    "Policy details fetched successfully"
  );
};

exports.createPolicyVersion = async (req, res) => {
  const { publicId } = req.params;
  const { contentMarkdown, makeActive } = req.body;

  const result = await service.createPolicyVersion(publicId, {
    contentMarkdown,
    makeActive,
  });

  return apiResponse.success(
    res,
    result,
    "Policy version created successfully",
    201
  );
};

exports.getActivePolicies = async (req, res) => {
  const policies = await service.getActivePolicies();

  return apiResponse.success(
    res,
    { policies },
    "Active policies fetched successfully"
  );
};

exports.recordUserAgreement = async (req, res) => {
  const { versionPublicId, ipAddress } = req.body;

  const agreement = await service.recordUserAgreement(req.user.id, {
    versionPublicId,
    ipAddress: ipAddress || req.ip,
  });

  return apiResponse.success(
    res,
    agreement,
    "User agreement recorded successfully",
    201
  );
};

exports.listUserAgreements = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await service.listUserAgreements(req.user.id, {
    page: Number(page),
    limit: Number(limit),
  });

  return apiResponse.success(
    res,
    result,
    "User agreements fetched successfully"
  );
};

exports.getPolicyTypes = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await service.listPolicyTypes({
    page: Number(page),
    limit: Number(limit),
  });

  return apiResponse.success(
    res,
    result,
    "Policy types fetched successfully"
  );
};

// exports.getActivePolicyByType = async (req, res) => {
//   const { type } = req.query;

//   if (!type) {
//     return apiResponse.error(res, "Policy type is required", 400);
//   }

//   const result = await service.getActivePolicyByType(type);

//   return apiResponse.success(
//     res,
//     result,
//     "Active policy fetched successfully"
//   );
// };

const toPolicyByTypeDto = (data) => {
  const version = data.versions?.[0];

  return {
    id: data.id,
    slug: data.slug,
    displayName: data.displayName,
    policyType: {
      id: data.policyType.id,
      code: data.policyType.code,
      displayName: data.policyType.displayName,
    },
    version: {
      versionNumber: version.versionNumber,
      contentMarkdown: version.contentMarkdown,
      createdAt: version.createdAt,
    },
  };
};
exports.getActivePolicyByType = async (req, res) => {
  const { type } = req.query;

  if (!type) {
    return apiResponse.error(res, "Policy type is required", 400);
  }

  const policy = await service.getActivePolicyByType(type);

  if (!policy) {
    return apiResponse.error(
      res,
      "There is no active policy for this policy type",
      404
    );
  }

  return apiResponse.success(
    res,
    toPolicyByTypeDto(policy),
    "Active policy fetched successfully"
  );
};