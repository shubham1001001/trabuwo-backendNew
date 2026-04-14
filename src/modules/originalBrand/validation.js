const { body } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createOriginalBrandValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("redirectCategoryId")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined || value === "null") {
        return null;
      }
      return value;
    })
    .isInt({ min: 1 })
    .withMessage("redirectCategoryId must be a positive integer"),
  body("displayOrder")
    .optional()
    .isInt({ min: 1 })
    .withMessage("displayOrder must be a positive integer"),
  body("isActive")
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

exports.updateOriginalBrandValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("redirectCategoryId")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined || value === "null") {
        return null;
      }
      return value;
    })
    .isInt({ min: 1 })
    .withMessage("redirectCategoryId must be a positive integer"),
  body("displayOrder")
    .optional()
    .isInt({ min: 1 })
    .withMessage("displayOrder must be a positive integer"),
  body("isActive")
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];
