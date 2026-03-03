const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.addToWishlistValidation = [
  body("productPublicId")
    .isUUID()
    .withMessage("productPublicId must be a valid UUID"),
  handleValidationErrors,
];

exports.removeFromWishlistValidation = [
  param("productPublicId")
    .isUUID()
    .withMessage("productPublicId must be a valid UUID"),
  handleValidationErrors,
];

