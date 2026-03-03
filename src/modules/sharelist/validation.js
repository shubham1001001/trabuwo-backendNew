const { body } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.addToSharelistValidation = [
  body("catalogueId").isUUID().withMessage("catalogueId must be a valid UUID"),
  handleValidationErrors,
];
