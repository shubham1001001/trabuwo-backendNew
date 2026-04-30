const { body, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.shareProductValidation = [
  body("productId")
    .notEmpty().withMessage("Product ID is required")
    .isUUID().withMessage("Product ID must be a valid UUID"),
  handleValidationErrors,
];

exports.getSharedProductsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  handleValidationErrors,
];
