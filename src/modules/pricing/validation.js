const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.updateProductPricesValidation = [
  param("productId").isUUID().withMessage("Product ID must be a valid UUID"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("defectiveReturnPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Defective return price must be a positive number"),
  handleValidationErrors,
];

exports.getPricingStatsValidation = [handleValidationErrors];

exports.getViewLossStatsValidation = [handleValidationErrors];

exports.incrementProductViewValidation = [
  param("productId").isUUID().withMessage("Product ID must be a valid UUID"),
  handleValidationErrors,
];
