const { body } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.validateBulkUploadImages = [
  body("images")
    .isArray({ min: 1, max: 10 })
    .withMessage("Images must be an array with 1-10 items"),
  body("images.*.fileName")
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("File name is required and must be 1-255 characters"),
  body("images.*.contentType")
    .isString()
    .matches(/^image\/(jpeg|jpg|png|gif|webp)$/)
    .withMessage("Content type must be a valid image type"),
  body("images.*.fileSize")
    .isInt({ min: 1, max: 10485760 }) // 10MB max
    .withMessage("File size must be between 1 byte and 10MB"),
  handleValidationErrors,
];
