const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const createTutorialVideoValidation = [
  body("url")
    .trim()
    .notEmpty()
    .withMessage("Video URL is required")
    .isURL()
    .withMessage("Invalid video URL format"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Video name is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Video name must be between 1 and 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Video description is required"),

  body("section")
    .trim()
    .isIn([
      "most_watched",
      "new_lessons",
      "registration",
      "getting_started",
      "how_to_start",
      "create_listing",
      "handling_operations",
      "growing_sales",
      "payments_and_penalties",
      "improve_sales",
      "advertising_products",
      "managing_operations",
    ])
    .withMessage("Invalid section value"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  handleValidationErrors,
];

const updateTutorialVideoValidation = [
  param("id").isInt({ min: 1 }).withMessage("Invalid tutorial video ID"),

  body("url")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Video URL cannot be empty")
    .isURL()
    .withMessage("Invalid video URL format"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Video name cannot be empty")
    .isLength({ min: 1, max: 200 })
    .withMessage("Video name must be between 1 and 200 characters"),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Video description cannot be empty"),

  body("section")
    .optional()
    .trim()
    .isIn([
      "most_watched",
      "new_lessons",
      "registration",
      "getting_started",
      "how_to_start",
      "create_listing",
      "handling_operations",
      "growing_sales",
      "payments_and_penalties",
      "improve_sales",
      "advertising_products",
      "managing_operations",
    ])
    .withMessage("Invalid section value"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  handleValidationErrors,
];

const getTutorialVideoByIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Invalid tutorial video ID"),
  handleValidationErrors,
];

const deleteTutorialVideoValidation = [
  param("id").isInt({ min: 1 }).withMessage("Invalid tutorial video ID"),
  handleValidationErrors,
];

const getAllTutorialVideosValidation = [
  query("section")
    .optional()
    .trim()
    .isIn([
      "most_watched",
      "new_lessons",
      "registration",
      "getting_started",
      "how_to_start",
      "create_listing",
      "handling_operations",
      "growing_sales",
      "payments_and_penalties",
      "improve_sales",
      "advertising_products",
      "managing_operations",
    ])
    .withMessage("Invalid section value"),

  query("includeInactive")
    .optional()
    .isIn(["true", "false"])
    .withMessage("includeInactive must be 'true' or 'false'"),
  handleValidationErrors,
];

module.exports = {
  createTutorialVideoValidation,
  updateTutorialVideoValidation,
  getTutorialVideoByIdValidation,
  deleteTutorialVideoValidation,
  getAllTutorialVideosValidation,
};
