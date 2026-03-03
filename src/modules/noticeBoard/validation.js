const { body, query, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createNoticeValidation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Title must be between 1 and 255 characters"),
  body("description")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Description is required"),
  body("imageUrl").trim().isURL().withMessage("Valid image URL is required"),
  body("s3Key").trim().isLength({ min: 1 }).withMessage("S3 key is required"),
  body("date")
    .isISO8601()
    .withMessage("Valid date is required (YYYY-MM-DD format)"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

exports.updateNoticeValidation = [
  param("id").isInt().withMessage("Valid notice ID is required"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Title must be between 1 and 255 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Description cannot be empty"),
  body("imageUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Valid image URL is required"),
  body("s3Key")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("S3 key cannot be empty"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Valid date is required (YYYY-MM-DD format)"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

exports.getNoticesValidation = [
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

exports.getNoticeByIdValidation = [
  param("id").isInt().withMessage("Valid notice ID is required"),
  handleValidationErrors,
];

exports.deleteNoticeValidation = [
  param("id").isInt().withMessage("Valid notice ID is required"),
  handleValidationErrors,
];

exports.toggleStatusValidation = [
  param("id").isInt().withMessage("Valid notice ID is required"),
  handleValidationErrors,
];

exports.generatePresignedUrlValidation = [
  body("fileName")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage(
      "fileName is required and must be between 1 and 255 characters"
    ),
  body("contentType")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(
      "contentType is required and must be between 1 and 100 characters"
    ),
  handleValidationErrors,
];

exports.deleteImageValidation = [
  body("s3Key")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("s3Key is required and must be between 1 and 500 characters"),
  handleValidationErrors,
];
