const { query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.validateGetProductsMetrics = [
  query("filterType")
    .optional()
    .isIn(["views", "clicks", "orders", "sales", "ratings"])
    .withMessage(
      "filterType must be one of: views, clicks, orders, sales, ratings"
    ),
  query("sortBy")
    .optional()
    .isIn(["topSelling", "lowSelling"])
    .withMessage("sortBy must be one of: topSelling, lowSelling"),
  query("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("categoryId must be a positive integer"),
  query("skuId")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("skuId must be a string between 1 and 100 characters"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("limit must be between 1 and 20"),
  handleValidationErrors,
];

exports.validateGetTotalMetrics = [
  query("startDate")
    .isISO8601()
    .withMessage("startDate must be a valid ISO date"),
  query("endDate").isISO8601().withMessage("endDate must be a valid ISO date"),
  handleValidationErrors,
];


exports.validateTopSellingCategories = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("limit must be between 1 and 20"),

  handleValidationErrors,
];

exports.validateGetCards = [
  handleValidationErrors,
];