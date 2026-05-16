const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.initiateReturnValidation = [
  body("orderItemPublicId")
    .isUUID()
    .withMessage("orderItemPublicId must be a valid UUID"),
  body("reason")
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Reason is required"),
  body("subreason")
    .optional()
    .isString()
    .trim(),
  handleValidationErrors,
];

exports.processRefundValidation = [
  param("id")
    .isUUID()
    .withMessage("Return ID must be a valid UUID"),
  handleValidationErrors,
];

exports.getReturnByIdValidation = [
  param("id")
    .isUUID()
    .withMessage("Return ID must be a valid UUID"),
  handleValidationErrors,
];

