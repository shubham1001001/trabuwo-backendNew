const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const {
  CLAIM_STATUSES,
  CLAIM_PRIORITIES,
  EVIDENCE_TYPES,
  REQUIRED_EVIDENCE_TYPES,
  RESPONSE_TYPES,
  PACKET_STATES,
} = require("./constants");

exports.createClaimCategoryValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

exports.getClaimCategoryByIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Claim category ID must be a positive integer"),
  handleValidationErrors,
];

exports.updateClaimCategoryValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Claim category ID must be a positive integer"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

exports.deleteClaimCategoryValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Claim category ID must be a positive integer"),
  handleValidationErrors,
];

exports.createClaimTypeValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("categoryId")
    .isInt({ min: 1 })
    .withMessage("Category ID is required and must be a positive integer"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

exports.getClaimTypeByIdValidation = [
  param("id").isUUID().withMessage("Claim type ID must be a valid UUID"),
  handleValidationErrors,
];

exports.updateClaimTypeValidation = [
  param("id").isUUID().withMessage("Claim type ID must be a valid UUID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

exports.deleteClaimTypeValidation = [
  param("id").isUUID().withMessage("Claim type ID must be a valid UUID"),
  handleValidationErrors,
];

exports.createClaimValidation = [
  body("claimTypeId")
    .isUUID()
    .withMessage("Claim type ID must be a valid UUID"),
  body("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Order ID must be between 1 and 100 characters"),
  body("awbNumber")
    .notEmpty()
    .withMessage("AWB Number is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("AWB Number must be between 1 and 100 characters"),
  body("packetId")
    .notEmpty()
    .withMessage("Packet ID is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Packet ID must be between 1 and 100 characters"),
  body("issueType")
    .notEmpty()
    .withMessage("Issue type is required")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Issue type must be between 1 and 500 characters"),
  body("stateOfPacket")
    .optional()
    .isIn(PACKET_STATES)
    .withMessage(`Packet state must be one of: ${PACKET_STATES.join(", ")}`),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  body("callbackNumber")
    .optional()
    .isString()
    .withMessage("Callback number must be a string")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Callback number must be between 10 and 15 characters"),
  body("evidence")
    .isArray({ min: REQUIRED_EVIDENCE_TYPES.length })
    .withMessage(
      `Evidence must be an array and include at least: ${REQUIRED_EVIDENCE_TYPES.join(
        ", "
      )}`
    ),
  body("evidence.*.evidenceType")
    .isIn(EVIDENCE_TYPES)
    .withMessage(`evidenceType must be one of: ${EVIDENCE_TYPES.join(", ")}`),
  body("evidence.*.fileKey")
    .notEmpty()
    .withMessage("fileKey is required for each evidence item"),
  body("evidence.*.fileUrl")
    .notEmpty()
    .withMessage("fileUrl is required for each evidence item"),
  body("evidence.*.fileName")
    .notEmpty()
    .withMessage("fileName is required for each evidence item"),
  body("evidence.*.fileSize")
    .isInt({ min: 1 })
    .withMessage("fileSize must be a positive integer for each evidence item"),
  body("evidence.*.mimeType")
    .notEmpty()
    .withMessage("mimeType is required for each evidence item"),
  handleValidationErrors,
];

exports.getClaimByIdValidation = [
  param("id").isUUID().withMessage("Claim ID must be a valid UUID"),
  handleValidationErrors,
];

exports.getClaimsByUserIdValidation = [
  query("status")
    .optional()
    .isIn(CLAIM_STATUSES)
    .withMessage(`Status must be one of: ${CLAIM_STATUSES.join(", ")}`),
  query("claimTypeId")
    .optional()
    .isUUID()
    .withMessage("Claim type ID must be a valid UUID"),
  query("priority")
    .optional()
    .isIn(CLAIM_PRIORITIES)
    .withMessage(`Priority must be one of: ${CLAIM_PRIORITIES.join(", ")}`),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

exports.getAllClaimsValidation = [
  query("status")
    .optional()
    .isIn(CLAIM_STATUSES)
    .withMessage(`Status must be one of: ${CLAIM_STATUSES.join(", ")}`),
  query("claimTypeId")
    .optional()
    .isUUID()
    .withMessage("Claim type ID must be a valid UUID"),
  query("userId")
    .optional()
    .isUUID()
    .withMessage("User ID must be a valid UUID"),
  handleValidationErrors,
];

exports.updateClaimValidation = [
  param("id").isUUID().withMessage("Claim ID must be a valid UUID"),
  body("claimTypeId")
    .optional()
    .isUUID()
    .withMessage("Claim type ID must be a valid UUID"),
  body("orderId")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Order ID must be between 1 and 100 characters"),
  body("awbNumber")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("AWB Number must be between 1 and 100 characters"),
  body("packetId")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Packet ID must be between 1 and 100 characters"),
  body("issueType")
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Issue type must be between 1 and 500 characters"),
  body("stateOfPacket")
    .optional()
    .isIn(PACKET_STATES)
    .withMessage(`Packet state must be one of: ${PACKET_STATES.join(", ")}`),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  body("status")
    .optional()
    .isIn(CLAIM_STATUSES)
    .withMessage(`Status must be one of: ${CLAIM_STATUSES.join(", ")}`),
  body("priority")
    .optional()
    .isIn(CLAIM_PRIORITIES)
    .withMessage(`Priority must be one of: ${CLAIM_PRIORITIES.join(", ")}`),
  body("callbackNumber")
    .optional()
    .isString()
    .withMessage("Callback number must be a string")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Callback number must be between 10 and 15 characters"),
  handleValidationErrors,
];

exports.deleteClaimValidation = [
  param("id").isUUID().withMessage("Claim ID must be a valid UUID"),
  handleValidationErrors,
];

exports.addClaimResponseValidation = [
  param("id").isUUID().withMessage("Claim ID must be a valid UUID"),
  body("responseType")
    .isIn(RESPONSE_TYPES)
    .withMessage(`Response type must be one of: ${RESPONSE_TYPES.join(", ")}`),
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),
  body("internalNotes")
    .optional()
    .isString()
    .withMessage("Internal notes must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Internal notes must not exceed 1000 characters"),
  handleValidationErrors,
];

exports.uploadClaimEvidenceValidation = [
  param("id").isUUID().withMessage("Claim ID must be a valid UUID"),
  body("evidence")
    .isArray({ min: 1 })
    .withMessage("Evidence must be a non-empty array"),
  body("evidence.*.evidenceType")
    .isIn(EVIDENCE_TYPES)
    .withMessage(`evidenceType must be one of: ${EVIDENCE_TYPES.join(", ")}`),
  body("evidence.*.fileKey")
    .notEmpty()
    .withMessage("fileKey is required for each evidence item"),
  body("evidence.*.fileUrl")
    .notEmpty()
    .withMessage("fileUrl is required for each evidence item"),
  body("evidence.*.fileName")
    .notEmpty()
    .withMessage("fileName is required for each evidence item"),
  body("evidence.*.fileSize")
    .isInt({ min: 1 })
    .withMessage("fileSize must be a positive integer for each evidence item"),
  body("evidence.*.mimeType")
    .notEmpty()
    .withMessage("mimeType is required for each evidence item"),
  handleValidationErrors,
];

exports.deleteClaimEvidenceValidation = [
  param("evidenceId").isUUID().withMessage("Evidence ID must be a valid UUID"),
  handleValidationErrors,
];

exports.generatePresignedUrlValidation = [
  body("fileName")
    .notEmpty()
    .withMessage("File name is required")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("File name must be between 1 and 255 characters"),
  body("contentType")
    .notEmpty()
    .withMessage("Content type is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Content type must be between 1 and 100 characters"),
  handleValidationErrors,
];
