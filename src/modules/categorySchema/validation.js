const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createCategorySchemaValidation = [
  body("categoryId").isInt().withMessage("categoryId must be an integer"),
  body("fieldName")
    .notEmpty()
    .withMessage("fieldName is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("fieldName must be between 1 and 50 characters"),
  body("fieldType")
    .isIn(["text", "number", "select", "multiselect", "boolean", "file"])
    .withMessage(
      "fieldType must be one of: text, number, select, multiselect, boolean, file"
    ),
  body("label")
    .notEmpty()
    .withMessage("label is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("label must be between 1 and 100 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("description must not exceed 1000 characters"),
  body("required")
    .optional()
    .isBoolean()
    .withMessage("required must be a boolean"),
  body("options")
    .optional()
    .isArray()
    .withMessage("options must be an array")
    .custom((value, { req }) => {
      if (
        req.body.fieldType === "select" ||
        req.body.fieldType === "multiselect"
      ) {
        if (!value || value.length === 0) {
          throw new Error(
            "Options are required for select and multiselect field types"
          );
        }
        if (
          !value.every(
            (option) => typeof option === "string" && option.length > 0
          )
        ) {
          throw new Error("All options must be non-empty strings");
        }
      }
      return true;
    }),
  body("validation")
    .optional()
    .isObject()
    .withMessage("validation must be an object")
    .custom((value) => {
      if (value) {
        const allowedKeys = ["minLength", "maxLength", "min", "max", "pattern"];
        const invalidKeys = Object.keys(value).filter(
          (key) => !allowedKeys.includes(key)
        );
        if (invalidKeys.length > 0) {
          throw new Error(`Invalid validation keys: ${invalidKeys.join(", ")}`);
        }
      }
      return true;
    }),
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("order must be a non-negative integer"),
  handleValidationErrors,
];

exports.updateCategorySchemaValidation = [
  param("id").isInt().withMessage("id must be an integer"),
  body("fieldName")
    .optional()
    .notEmpty()
    .withMessage("fieldName cannot be empty")
    .isLength({ min: 1, max: 50 })
    .withMessage("fieldName must be between 1 and 50 characters")
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage(
      "fieldName must start with a letter or underscore and contain only letters, numbers, and underscores"
    ),
  body("fieldType")
    .optional()
    .isIn(["text", "number", "select", "multiselect", "boolean", "file"])
    .withMessage(
      "fieldType must be one of: text, number, select, multiselect, boolean, file"
    ),
  body("label")
    .optional()
    .notEmpty()
    .withMessage("label cannot be empty")
    .isLength({ min: 1, max: 100 })
    .withMessage("label must be between 1 and 100 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("description must not exceed 1000 characters"),
  body("required")
    .optional()
    .isBoolean()
    .withMessage("required must be a boolean"),
  body("options")
    .optional()
    .isArray()
    .withMessage("options must be an array")
    .custom((value, { req }) => {
      if (
        req.body.fieldType === "select" ||
        req.body.fieldType === "multiselect"
      ) {
        if (!value || value.length === 0) {
          throw new Error(
            "Options are required for select and multiselect field types"
          );
        }
        if (
          !value.every(
            (option) => typeof option === "string" && option.length > 0
          )
        ) {
          throw new Error("All options must be non-empty strings");
        }
      }
      return true;
    }),
  body("validation")
    .optional()
    .isObject()
    .withMessage("validation must be an object")
    .custom((value) => {
      if (value) {
        const allowedKeys = ["minLength", "maxLength", "min", "max", "pattern"];
        const invalidKeys = Object.keys(value).filter(
          (key) => !allowedKeys.includes(key)
        );
        if (invalidKeys.length > 0) {
          throw new Error(`Invalid validation keys: ${invalidKeys.join(", ")}`);
        }
      }
      return true;
    }),
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("order must be a non-negative integer"),
  handleValidationErrors,
];

exports.getCategorySchemaValidation = [
  param("categoryId").isInt().withMessage("categoryId must be an integer"),
  handleValidationErrors,
];

exports.deleteCategorySchemaValidation = [
  param("id").isInt().withMessage("id must be an integer"),
  handleValidationErrors,
];

exports.deleteCategorySchemasByCategoryIdValidation = [
  param("categoryId").isInt().withMessage("categoryId must be an integer"),
  handleValidationErrors,
];

exports.getSchemasByFieldTypeValidation = [
  param("fieldType")
    .isIn(["text", "number", "select", "multiselect", "boolean", "file"])
    .withMessage(
      "fieldType must be one of: text, number, select, multiselect, boolean, file"
    ),
  handleValidationErrors,
];

exports.bulkUpdateSchemasValidation = [
  body("updates")
    .isArray({ min: 1 })
    .withMessage("updates must be a non-empty array"),
  body("updates.*.id")
    .isInt()
    .withMessage("Each update must have a valid integer id"),
  body("updates.*.data")
    .isObject()
    .withMessage("Each update must have a data object"),
  handleValidationErrors,
];

exports.validateSchemaForCategoryValidation = [
  param("categoryId").isInt().withMessage("categoryId must be an integer"),
  body().isObject().withMessage("Request body must be an object"),
  handleValidationErrors,
];

exports.queryValidation = [
  query("fieldType")
    .optional()
    .isIn(["text", "number", "select", "multiselect", "boolean", "file"])
    .withMessage(
      "fieldType must be one of: text, number, select, multiselect, boolean, file"
    ),
  handleValidationErrors,
];

exports.bulkCreateSchemasValidation = [
  body("schemas")
    .isArray({ min: 1 })
    .withMessage("schemas must be a non-empty array"),
  body("categoryId").isInt().withMessage("categoryId must be an integer"),
  body("schemas.*.fieldName")
    .notEmpty()
    .withMessage("Each schema must have a fieldName")
    .isLength({ min: 1, max: 50 })
    .withMessage("fieldName must be between 1 and 50 characters"),
  body("schemas.*.fieldType")
    .isIn(["text", "number", "select", "boolean"])
    .withMessage("fieldType must be one of: text, number, select, boolean"),
  body("schemas.*.label")
    .notEmpty()
    .withMessage("Each schema must have a label")
    .isLength({ min: 1, max: 100 })
    .withMessage("label must be between 1 and 100 characters"),
  body("schemas.*.description")
    .optional()
    .isString()
    .withMessage("description must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("description must not exceed 1000 characters"),
  body("schemas.*.required")
    .optional()
    .isBoolean()
    .withMessage("required must be a boolean"),
  body("schemas.*.options")
    .optional()
    .isArray()
    .withMessage("options must be an array")
    .custom((value, { req, path }) => {
      const schemaIndex = path.split(".")[1];
      const fieldType = req.body.schemas[schemaIndex]?.fieldType;
      if (fieldType === "select") {
        if (!value || value.length === 0) {
          throw new Error("Options are required for select field types");
        }
        if (
          !value.every(
            (option) => typeof option === "string" && option.length > 0
          )
        ) {
          throw new Error("All options must be non-empty strings");
        }
      }
      return true;
    }),
  body("schemas.*.validation")
    .optional()
    .isObject()
    .withMessage("validation must be an object")
    .custom((value) => {
      if (value) {
        const allowedKeys = ["minLength", "maxLength", "min", "max", "pattern"];
        const invalidKeys = Object.keys(value).filter(
          (key) => !allowedKeys.includes(key)
        );
        if (invalidKeys.length > 0) {
          throw new Error(`Invalid validation keys: ${invalidKeys.join(", ")}`);
        }
      }
      return true;
    }),
  body("schemas.*.order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("order must be a non-negative integer"),
  handleValidationErrors,
];

exports.downloadExcelTemplateValidation = [
  param("categoryId").isInt().withMessage("categoryId must be a valid integer"),
  handleValidationErrors,
];

exports.getAvailableFiltersValidation = [
  param("categoryId")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
  handleValidationErrors,
];
