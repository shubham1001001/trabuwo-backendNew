const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const createCategoryIconValidation = [
  body("categoryId")
    .isInt({ min: 1 })
    .withMessage("categoryId must be a positive integer"),
  body("altText")
    .isLength({ max: 255 })
    .withMessage("altText max 255"),
  body("filter")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch {
          throw new Error("filter must be a valid JSON object");
        }
      }
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return true;
      }
      throw new Error("filter must be a valid JSON object");
    })
    .withMessage("filter must be a valid JSON object"),
  handleValidationErrors,
];

const updateCategoryIconValidation = [
  param("publicId").isUUID().withMessage("publicId must be a valid UUID"),
  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("categoryId must be a positive integer"),
  body("altText")
    .optional()
    .isLength({ max: 255 })
    .withMessage("altText max 255"),
  body("enabled")
    .optional()
    .isBoolean()
    .withMessage("enabled must be boolean"),
  body("filter")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch {
          throw new Error("filter must be a valid JSON object");
        }
      }
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return true;
      }
      throw new Error("filter must be a valid JSON object");
    })
    .withMessage("filter must be a valid JSON object"),
  handleValidationErrors,
];

const deleteCategoryIconValidation = [
  param("publicId").isUUID().withMessage("publicId must be a valid UUID"),
  handleValidationErrors,
];

const getCategoryIconsByCategoryIdValidation = [
  param("categoryId")
    .isInt({ min: 1 })
    .withMessage("categoryId must be a positive integer"),
  handleValidationErrors,
];

module.exports = {
  createCategoryIconValidation,
  updateCategoryIconValidation,
  deleteCategoryIconValidation,
  getCategoryIconsByCategoryIdValidation,
};


