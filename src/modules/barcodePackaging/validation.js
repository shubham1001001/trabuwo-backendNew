const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const createVendorValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .isString()
    .withMessage("Location must be a string"),
  body("imgS3Key")
    .notEmpty()
    .withMessage("Image S3 key is required")
    .isString()
    .withMessage("Image S3 key must be a string"),
  body("pricePerPacket")
    .notEmpty()
    .withMessage("Price per packet is required")
    .isFloat({ min: 0 })
    .withMessage("Price per packet must be a positive number"),
  body("redirectUrl")
    .notEmpty()
    .withMessage("Redirect URL is required")
    .isURL()
    .withMessage("Redirect URL must be a valid URL"),
  handleValidationErrors,
];

const updateVendorValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid vendor ID is required"),
  body("name").optional().isString().withMessage("Name must be a string"),
  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string"),
  body("imgS3Key")
    .optional()
    .isString()
    .withMessage("Image S3 key must be a string"),
  body("pricePerPacket")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price per packet must be a positive number"),
  body("redirectUrl")
    .optional()
    .isURL()
    .withMessage("Redirect URL must be a valid URL"),
  handleValidationErrors,
];

const getVendorValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid vendor ID is required"),
  handleValidationErrors,
];

const getVendorByPublicIdValidation = [
  param("publicId").isUUID().withMessage("Valid vendor public ID is required"),
  handleValidationErrors,
];

const deleteVendorValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid vendor ID is required"),
  handleValidationErrors,
];

const presignedUrlValidation = [
  body("key")
    .notEmpty()
    .withMessage("Key is required")
    .isString()
    .withMessage("Key must be a string"),
  body("contentType")
    .notEmpty()
    .withMessage("Content type is required")
    .isString()
    .withMessage("Content type must be a string"),
];

module.exports = {
  createVendorValidation,
  updateVendorValidation,
  getVendorValidation,
  getVendorByPublicIdValidation,
  deleteVendorValidation,
  presignedUrlValidation,
};
