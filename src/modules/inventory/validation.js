const { query, body } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const getCataloguesValidation = [
  query("status")
    .optional()
    .isIn(["active", "paused", "blocked", "activation_pending"])
    .withMessage(
      "Status must be one of: active, paused, blocked, activation_pending"
    ),
  query("sortBy")
    .optional()
    .isIn(["newest", "oldest"])
    .withMessage("sortBy must be one of: newest, oldest"),
  query("stockFilter")
    .optional()
    .isIn(["all_stock", "out_of_stock", "low_stock"])
    .withMessage(
      "Stock filter must be one of: all_stock, out_of_stock, low_stock"
    ),
  query("blockReasonFilter")
    .optional()
    .isIn([
      "duplicate",
      "poor_quality",
      "verification_failed",
      "account_paused",
      "other",
    ])
    .withMessage(
      "Block reason filter must be one of: duplicate, poor_quality, verification_failed, account_paused, other"
    ),
  query("catalogueId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Catalogue ID must be a positive integer"),
  query("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
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

const updateStockValidation = [
  body("stock")
    .isInt({ min: 1 })
    .withMessage("Stock must be a non-negative integer"),
  handleValidationErrors,
];

const bulkPauseValidation = [
  body("productIds")
    .isArray({ min: 1 })
    .withMessage("Product IDs must be an array with at least one product"),
  body("productIds.*")
    .isUUID()
    .withMessage("Each product ID must be a valid UUID"),
  handleValidationErrors,
];

module.exports = {
  getCataloguesValidation,
  updateStockValidation,
  bulkPauseValidation,
};
