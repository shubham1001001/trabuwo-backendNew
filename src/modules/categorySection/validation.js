const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const SAFE_FILTER_KEY_PATTERN = /^[a-zA-Z0-9_]+$/;

function isScalar(v) {
  const t = typeof v;
  return t === "string" || t === "number" || t === "boolean";
}

function isValidFilterValue(value) {
  if (isScalar(value)) return true;
  if (Array.isArray(value)) {
    return value.every((item) => isScalar(item));
  }
  return false;
}

const createSectionValidation = [
  body("categoryId")
    .isInt({ min: 1 })
    .withMessage("categoryId must be a positive integer"),
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("name must be between 2 and 100 chars"),
  body("displayOrder")
    .isInt({ min: 1 })
    .withMessage("displayOrder must be a positive integer"),
  body("layout")
    .optional()
    .isIn(["horizontal", "grid"])
    .withMessage("layout must be one of horizontal, grid"),
  body("column")
    .optional()
    .isInt({ min: 1 })
    .withMessage("column must be a positive integer"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean"),
  body("filter")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch {
          throw new Error("filter must be a valid JSON object");
        }
      }
      if (
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value)
      ) {
        throw new Error("filter must be a valid JSON object");
      }
      for (const [key, val] of Object.entries(value)) {
        if (!SAFE_FILTER_KEY_PATTERN.test(key)) {
          throw new Error(
            "filter keys must be alphanumeric or underscore only"
          );
        }
        if (!isValidFilterValue(val)) {
          throw new Error(
            "filter values must be scalar (string, number, boolean) or array of scalars"
          );
        }
      }
      return true;
    })
    .withMessage("filter must be a valid JSON object"),
  handleValidationErrors,
];

const getPublicByCategoryValidation = [
  param("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("categoryId must be integer"),
  query("deviceType")
    .optional()
    .isIn(["mobile", "web", "both"])
    .withMessage("deviceType must be one of mobile, web, both"),
  handleValidationErrors,
];

const updateSectionValidation = [
  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("categoryId must be a positive integer"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("name must be between 2 and 100 chars"),
  body("displayOrder")
    .optional()
    .isInt({ min: 1 })
    .withMessage("displayOrder must be a positive integer"),
  body("layout")
    .optional()
    .isIn(["horizontal", "grid"])
    .withMessage("layout must be one of horizontal, grid"),
  body("column")
    .optional()
    .isInt({ min: 1 })
    .withMessage("column must be a positive integer"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean"),
  body("filter")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch {
          throw new Error("filter must be a valid JSON object");
        }
      }
      if (
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value)
      ) {
        throw new Error("filter must be a valid JSON object");
      }
      for (const [key, val] of Object.entries(value)) {
        if (!SAFE_FILTER_KEY_PATTERN.test(key)) {
          throw new Error(
            "filter keys must be alphanumeric or underscore only"
          );
        }
        if (!isValidFilterValue(val)) {
          throw new Error(
            "filter values must be scalar (string, number, boolean) or array of scalars"
          );
        }
      }
      return true;
    })
    .withMessage("filter must be a valid JSON object"),
  handleValidationErrors,
];

module.exports = {
  createSectionValidation,
  getPublicByCategoryValidation,
  updateSectionValidation,
};
