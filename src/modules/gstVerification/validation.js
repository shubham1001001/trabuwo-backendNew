const { body } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.verifyAndStoreValidation = [
  body("idValue").notEmpty().withMessage("idValue is required"),
  handleValidationErrors,
];

