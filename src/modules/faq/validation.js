const { body, param, query } = require("express-validator");

const createFaqValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("FAQ name is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("FAQ name must be between 1 and 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("FAQ description is required"),

  body("section")
    .trim()
    .isIn(["settings", "other"])
    .notEmpty()
    .withMessage("FAQ section is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("FAQ section must be between 1 and 100 characters"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

const updateFaqValidation = [
  param("id").isInt({ min: 1 }).withMessage("Invalid FAQ ID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("FAQ name cannot be empty")
    .isLength({ min: 1, max: 200 })
    .withMessage("FAQ name must be between 1 and 200 characters"),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("FAQ description cannot be empty"),

  body("section")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("FAQ section cannot be empty")
    .isLength({ min: 1, max: 100 })
    .withMessage("FAQ section must be between 1 and 100 characters"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

const getFaqByIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Invalid FAQ ID"),
];

const deleteFaqValidation = [
  param("id").isInt({ min: 1 }).withMessage("Invalid FAQ ID"),
];

const getAllFaqsValidation = [
  query("section")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Section cannot be empty if provided"),

  query("includeInactive")
    .optional()
    .isIn(["true", "false"])
    .withMessage("includeInactive must be 'true' or 'false'"),
];

module.exports = {
  createFaqValidation,
  updateFaqValidation,
  getFaqByIdValidation,
  deleteFaqValidation,
  getAllFaqsValidation,
};
