const { query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.getRecommendationsValidation = [
  query("categoryId")
    .exists({ checkFalsy: true })
    .withMessage("categoryId is required")
    .isUUID()
    .withMessage("categoryId must be a valid UUID"),
  handleValidationErrors,
];
