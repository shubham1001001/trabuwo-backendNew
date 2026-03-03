const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const { VALID_STATUSES, VALID_QC_STATUSES } = require("./constants");

exports.createCatalogueValidation = [
  body("name")
    .notEmpty()
    .withMessage("Catalogue name is required")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Catalogue name must be between 1 and 255 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),
  handleValidationErrors,
];

exports.updateCatalogueValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Catalogue ID must be a positive integer"),
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Catalogue name cannot be empty")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Catalogue name must be between 1 and 255 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),
  handleValidationErrors,
];

exports.submitCatalogueValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Catalogue ID must be a positive integer"),
  handleValidationErrors,
];

exports.updateQCStatusValidation = [
  param("id").isUUID().withMessage("Catalogue ID must be a valid UUID"),
  body("status")
    .isIn(VALID_QC_STATUSES)
    .withMessage(`Status must be either '${VALID_QC_STATUSES.join("' or '")}'`),
  body("qcNotes")
    .optional()
    .isString()
    .withMessage("QC notes must be a string")
    .trim()
    .isLength({ max: 2000 })
    .withMessage("QC notes must not exceed 2000 characters"),
  handleValidationErrors,
];

exports.deleteCatalogueValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Catalogue ID must be a positive integer"),
  handleValidationErrors,
];

exports.getCatalogueByIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Catalogue ID must be a positive integer"),
  handleValidationErrors,
];

exports.getCataloguesByStatusValidation = [
  param("status")
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
  handleValidationErrors,
];

exports.getCatalogueListValidation = [
  query("status")
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Search term must be a string between 1 and 255 characters"),
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

exports.getCataloguesBySellerPublicIdValidation = [
  param("sellerPublicId")
    .isUUID()
    .withMessage("Seller publicId must be a valid UUID"),
  query("status")
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Search term must be a string between 1 and 255 characters"),
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

exports.getAllCataloguesKeysetValidation = [
  query("cursor").optional().isString().withMessage("Cursor must be a string"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .isIn(["priceHighToLow", "priceLowToHigh", "rating", "promotion"])
    .withMessage(
      "sortBy must be one of: priceHighToLow, priceLowToHigh, rating, promotion",
    ),
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Search term must be a string between 1 and 255 characters"),
  query("priceMin")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),
  query("priceMax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number"),
  query("rating")
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(
          (v) =>
            !isNaN(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= 5,
        );
      }
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0 && num <= 5;
    })
    .withMessage("Rating must be a number between 0 and 5"),
  query("discount")
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(
          (v) =>
            !isNaN(parseFloat(v)) && parseFloat(v) >= 10 && parseFloat(v) <= 90,
        );
      }
      const num = parseFloat(value);
      return !isNaN(num) && num >= 10 && num <= 90;
    })
    .withMessage("Discount must be a number between 10 and 90"),
  query("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
  query().custom(() => {
    return true;
  }),
  handleValidationErrors,
];

exports.searchMinimalCataloguesValidation = [
  query("q")
    .notEmpty()
    .withMessage("Search query is required")
    .isString()
    .withMessage("Search query must be a string")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Search query must be between 1 and 255 characters"),
  handleValidationErrors,
];

exports.getMyCataloguesValidation = [
  query("status")
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
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
