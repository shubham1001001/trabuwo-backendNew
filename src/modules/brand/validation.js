const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

/**
 * CREATE BRAND
 */
exports.create = [
  body("name")
    .notEmpty()
    .withMessage("Brand name is required")
    .isLength({ max: 255 })
    .withMessage("Name must be less than 255 characters"),

  body("logoUrl")
    .optional()
    .isURL()
    .withMessage("Logo URL must be a valid URL"),

  body("bannerUrl")
    .optional()
    .isURL()
    .withMessage("Banner URL must be a valid URL"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("websiteUrl")
    .optional()
    .isURL()
    .withMessage("Website URL must be a valid URL"),

  handleValidationErrors,
];

/**
 * UPDATE BRAND
 */
exports.update = [
  param("publicId")
    .isUUID()
    .withMessage("Invalid publicId"),

  body("name")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Name must be less than 255 characters"),

  body("logoUrl")
    .optional()
    .isURL()
    .withMessage("Logo URL must be a valid URL"),

  body("bannerUrl")
    .optional()
    .isURL()
    .withMessage("Banner URL must be a valid URL"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("websiteUrl")
    .optional()
    .isURL()
    .withMessage("Website URL must be a valid URL"),

  body("status")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Invalid status"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean"),

  body("isVerified")
    .optional()
    .isBoolean()
    .withMessage("isVerified must be boolean"),

  handleValidationErrors,
];

/**
 * GET BRAND BY PUBLIC ID
 */
exports.getByPublicId = [
  param("publicId")
    .isUUID()
    .withMessage("Invalid publicId"),

  handleValidationErrors,
];

/**
 * DELETE BRAND
 */
exports.deleteBrand = [
  param("publicId")
    .isUUID()
    .withMessage("Invalid publicId"),

  handleValidationErrors,
];

/**
 * LIST BRANDS (Pagination + Filters)
 */
exports.list = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be >= 0"),

  query("status")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Invalid status"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean"),

  query("search")
    .optional()
    .isString()
    .withMessage("Search must be string"),

  handleValidationErrors,
];