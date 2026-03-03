const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.addToCartValidation = [
  body("productVariantId")
    .isUUID()
    .withMessage("productVariantId must be a valid UUID"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("quantity must be a positive integer"),
  handleValidationErrors,
];

exports.updateCartItemValidation = [
  param("productVariantId")
    .isUUID()
    .withMessage("productVariantId must be a valid UUID"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("quantity must be a positive integer"),
  handleValidationErrors,
];

exports.removeFromCartValidation = [
  param("productVariantId")
    .isUUID()
    .withMessage("productVariantId must be a valid UUID"),
  handleValidationErrors,
];
