const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createPolicyValidation = [
  body("slug").isString().notEmpty().withMessage("slug is required"),
  body("displayName")
    .isString()
    .notEmpty()
    .withMessage("displayName is required"),
  body("policyTypeCode")
    .isString()
    .notEmpty()
    .withMessage("policyTypeCode is required"),
  handleValidationErrors,
];

exports.updatePolicyValidation = [
  param("publicId").isUUID().withMessage("publicId must be a valid UUID"),
  body("displayName").optional().isString(),
  body("policyTypeCode").optional().isString(),
  handleValidationErrors,
];

exports.listPoliciesValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidationErrors,
];

exports.getPolicyValidation = [
  param("publicId").isUUID().withMessage("publicId must be a valid UUID"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidationErrors,
];

exports.createPolicyVersionValidation = [
  param("publicId").isUUID().withMessage("publicId must be a valid UUID"),
  body("contentMarkdown")
    .isString()
    .notEmpty()
    .withMessage("contentMarkdown is required"),
  body("makeActive").optional().isBoolean().toBoolean(),
  handleValidationErrors,
];

exports.recordUserAgreementValidation = [
  body("versionPublicId")
    .isUUID()
    .withMessage("versionPublicId must be a valid UUID"),
  body("ipAddress").optional().isString(),
  handleValidationErrors,
];

exports.listUserAgreementsValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidationErrors,
];

