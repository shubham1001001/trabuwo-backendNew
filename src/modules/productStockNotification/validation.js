const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.subscribeToVariantValidation = [
  body("productVariantPublicId")
    .isUUID()
    .withMessage("productVariantPublicId must be a valid UUID"),
  handleValidationErrors,
];

exports.unsubscribeFromVariantValidation = [
  param("notificationPublicId")
    .isUUID()
    .withMessage("notificationPublicId must be a valid UUID"),
  handleValidationErrors,
];
