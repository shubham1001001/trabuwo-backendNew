const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createCallbackValidation = [
  body("mobile").notEmpty().withMessage("Mobile is required"),
  handleValidationErrors,
];

exports.updateStatusValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid callback ID is required"),
  body("status")
    .isIn(["pending", "success"])
    .withMessage("Status must be either 'pending' or 'success'"),
  handleValidationErrors,
];

exports.deleteCallbackValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid callback ID is required"),
  handleValidationErrors,
];

exports.getAllCallbacksValidation = [
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

exports.getCallbackByIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid callback ID is required"),
  handleValidationErrors,
];
