const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createHomeCategoryValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Home category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Home category name must be between 2 and 100 characters"),
  body("parentId")
    .optional({ checkFalsy: true, nullable: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return parseInt(value, 10);
    })
    .custom((value) => {
      if (value === null) return true;
      return Number.isInteger(value) && value >= 1;
    })
    .withMessage("parentId must be a positive integer or null"),
  body("sectionId")
    .optional({ checkFalsy: true, nullable: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return parseInt(value, 10);
    })
    .custom((value) => {
      if (value === null) return true;
      return Number.isInteger(value) && value >= 1;
    })
    .withMessage("sectionId must be a positive integer or null"),
  body("redirectCategoryId")
    .optional({ checkFalsy: true, nullable: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return parseInt(value, 10);
    })
    .custom((value) => {
      if (value === null) return true;
      return Number.isInteger(value) && value >= 1;
    })
    .withMessage("redirectCategoryId must be a positive integer or null"),
  body("displayOrder")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .isInt({ min: 0 })
    .withMessage("displayOrder must be a non-negative integer"),
  body("isActive")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .toBoolean()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  body("showOnHomePage")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .toBoolean()
    .isBoolean()
    .withMessage("showOnHomePage must be a boolean value"),
  body("deviceType")
    .optional({ checkFalsy: true })
    .isIn(["mobile", "web", "both"])
    .withMessage("deviceType must be one of: mobile, web, both"),
  body("filters")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }
      return typeof value === "object" && value !== null;
    })
    .withMessage("filters must be a valid JSON object"),
  handleValidationErrors,
];

exports.updateHomeCategoryValidation = [
  param("publicId").isUUID().withMessage("publicId must be a valid UUID"),
  body("name")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Home category name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Home category name must be between 2 and 100 characters"),
  body("parentId")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (value === "" || value === null) {
        return null;
      }
      return parseInt(value, 10);
    })
    .custom((value) => {
      if (value === undefined || value === null) return true;
      return Number.isInteger(value) && value >= 1;
    })
    .withMessage("parentId must be a positive integer or null"),
  body("sectionId")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (value === "" || value === null) {
        return null;
      }
      return parseInt(value, 10);
    })
    .custom((value) => {
      if (value === undefined || value === null) return true;
      return Number.isInteger(value) && value >= 1;
    })
    .withMessage("sectionId must be a positive integer or null"),
  body("redirectCategoryId")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (value === "" || value === null) {
        return null;
      }
      return parseInt(value, 10);
    })
    .custom((value) => {
      if (value === undefined || value === null) return true;
      return Number.isInteger(value) && value >= 1;
    })
    .withMessage("redirectCategoryId must be a positive integer or null"),
  body("displayOrder")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .isInt({ min: 0 })
    .withMessage("displayOrder must be a non-negative integer"),
  body("isActive")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .toBoolean()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  body("showOnHomePage")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .toBoolean()
    .isBoolean()
    .withMessage("showOnHomePage must be a boolean value"),
  body("deviceType")
    .optional({ checkFalsy: true })
    .isIn(["mobile", "web", "both"])
    .withMessage("deviceType must be one of: mobile, web, both"),
  body("filters")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }
      return typeof value === "object" && value !== null;
    })
    .withMessage("filters must be a valid JSON object"),
  handleValidationErrors,
];

exports.getAllHomeCategoriesValidation = [
  query("sectionId")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("sectionId must be a positive integer"),
  query("parentId")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      if (value === "null") {
        return null;
      }
      return value;
    })
    .custom((value) => {
      if (value === null || value === undefined) {
        return true;
      }
      return Number.isInteger(parseInt(value, 10)) && parseInt(value, 10) >= 1;
    })
    .withMessage("parentId must be a positive integer or null"),
  query("isActive")
    .optional({ checkFalsy: true })
    .isIn(["true", "false"])
    .withMessage("isActive must be 'true' or 'false'"),
  query("deviceType")
    .optional({ checkFalsy: true })
    .isIn(["mobile", "web", "both"])
    .withMessage("deviceType must be one of: mobile, web, both"),
  handleValidationErrors,
];

exports.deleteHomeCategoryValidation = [
  param("publicId").isUUID().withMessage("publicId must be a valid UUID"),
  handleValidationErrors,
];

exports.getHomeCategoriesForHomePageValidation = [handleValidationErrors];

exports.getHomeCategoriesBySectionValidation = [
  param("sectionId")
    .isInt({ min: 1 })
    .withMessage("sectionId must be a positive integer"),
  query("deviceType")
    .optional({ checkFalsy: true })
    .isIn(["mobile", "web", "both"])
    .withMessage("deviceType must be one of: mobile, web, both"),
  handleValidationErrors,
];
