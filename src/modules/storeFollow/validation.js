const { param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.storeIdValidation = [
  param("storeId").isUUID().withMessage("Store ID must be a valid UUID"),
  handleValidationErrors,
];

exports.sellerPublicIdValidation = [
  param("sellerPublicId")
    .isUUID()
    .withMessage("Seller public ID must be a valid UUID"),
  handleValidationErrors,
];
