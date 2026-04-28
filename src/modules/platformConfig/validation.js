const { body, param, query } = require("express-validator");

exports.updateConfigValidation = [
  param("key").notEmpty().withMessage("Config key is required"),
  body("value").notEmpty().withMessage("Value is required"),
];

exports.createConfigValidation = [
  body("key")
    .notEmpty()
    .withMessage("Config key is required")
    .matches(/^[a-z_]+$/)
    .withMessage("Key must be lowercase with underscores only"),
  body("value").notEmpty().withMessage("Value is required"),
  body("valueType")
    .optional()
    .isIn(["number", "percentage", "boolean", "json"])
    .withMessage("Invalid value type"),
  body("category").optional().isString(),
  body("description").optional().isString(),
];

exports.upsertCategoryCommissionValidation = [
  param("categoryId")
    .notEmpty()
    .isInt({ min: 1 })
    .withMessage("Valid category ID is required"),
  body("commissionRate")
    .notEmpty()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Commission rate must be between 0 and 100"),
];

exports.deleteCategoryCommissionValidation = [
  param("categoryId")
    .notEmpty()
    .isInt({ min: 1 })
    .withMessage("Valid category ID is required"),
];

exports.getCategoryQueryValidation = [
  query("category").optional().isString(),
];
