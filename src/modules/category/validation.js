const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createCategoryValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),
  body("parentId")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .isInt({ min: 1 })
    .withMessage("parentId must be a positive integer"),
  body("isVisible")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .toBoolean()
    .isBoolean()
    .withMessage("isVisible must be a boolean value"),
  body("showOnWeb")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .toBoolean()
    .isBoolean()
    .withMessage("showOnWeb must be a boolean value"),
  body("displayOrderWeb")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .isInt({ min: 0 })
    .withMessage("displayOrderWeb must be a non-negative integer"),
  body("isGold")
    .optional({ checkFalsy: true })
    .toBoolean()
    .isBoolean()
    .withMessage("isGold must be a boolean value"),
  handleValidationErrors,
];

exports.updateCategoryValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
  body("name")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),
  body("parentId")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .isInt({ min: 1 })
    .withMessage("parentId must be a positive integer"),
  body("isVisible")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .toBoolean()
    .isBoolean()
    .withMessage("isVisible must be a boolean value"),
  body("showOnWeb")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .toBoolean()
    .isBoolean()
    .withMessage("showOnWeb must be a boolean value"),
  body("displayOrderWeb")
    .optional({ checkFalsy: true })
    .customSanitizer((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
    .isInt({ min: 0 })
    .withMessage("displayOrderWeb must be a non-negative integer"),
  body("isGold")
    .optional({ checkFalsy: true })
    .toBoolean()
    .isBoolean()
    .withMessage("isGold must be a boolean value"),
  handleValidationErrors,
];

exports.hideUnhideCategoryValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
  body("isVisible")
    .isBoolean()
    .withMessage("isVisible must be a boolean value"),
  handleValidationErrors,
];

exports.softDeleteCategoryValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
  handleValidationErrors,
];

exports.getCategoryByIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
  handleValidationErrors,
];

exports.getCategoriesByParentIdValidation = [
  param("parentId")
    .isInt({ min: 1 })
    .withMessage("Parent ID must be a positive integer"),
  handleValidationErrors,
];

exports.searchCategoriesValidation = [
  query("searchTerm")
    .exists({ checkFalsy: true })
    .withMessage("Search term is required")
    .isString()
    .withMessage("Search term must be a string"),
  handleValidationErrors,
];

exports.getCategoryChildrenOrSiblingsValidation = [
  param("categoryId")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
  handleValidationErrors,
];

exports.searchCategoryFiltersValidation = [
  query("searchTerm")
    .exists({ checkFalsy: true })
    .withMessage("Search term is required")
    .isString()
    .withMessage("Search term must be a string"),
  handleValidationErrors,
];
