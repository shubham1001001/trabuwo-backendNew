const { body } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createTaxIdentityValidation = [
  body("type")
    .isIn(["GST_NUMBER", "UIN_ENROLLMENT_ID"])
    .withMessage("type must be GST_NUMBER or UIN_ENROLLMENT_ID"),
  body("value").notEmpty().withMessage("value is required"),
  handleValidationErrors,
];

exports.createBankDetailsValidation = [
  body("accountNumber").notEmpty().withMessage("accountNumber is required"),
  body("ifscCode").notEmpty().withMessage("ifscCode is required"),
  handleValidationErrors,
];

exports.createStoreValidation = [
  body("name").notEmpty().withMessage("name is required"),
  body("ownerFullName").notEmpty().withMessage("ownerFullName is required"),
  body("signatureS3Key").notEmpty().withMessage("signatureS3Key is required"),
  body("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("Valid email is required"),
  handleValidationErrors,
];

exports.createAddressValidation = [
  body("buildingNumber").notEmpty().withMessage("buildingNumber is required"),
  body("street").notEmpty().withMessage("street is required"),
  body("landmark").notEmpty().withMessage("landmark is required"),
  body("pincode").notEmpty().withMessage("pincode is required"),
  body("city").notEmpty().withMessage("city is required"),
  body("state").notEmpty().withMessage("state is required"),
  handleValidationErrors,
];

exports.createLocationValidation = [
  body("pincode").notEmpty().withMessage("pincode is required"),
  body("city").notEmpty().withMessage("city is required"),
  body("state").notEmpty().withMessage("state is required"),
  handleValidationErrors,
];

exports.generatePresignedUrlValidation = [
  body("fileName")
    .notEmpty()
    .withMessage("File name is required")
    .isLength({ max: 255 })
    .withMessage("File name must be less than 255 characters"),
  body("contentType")
    .notEmpty()
    .withMessage("Content type is required")
    .isIn(["image/jpeg", "image/png", "image/gif", "image/webp"])
    .withMessage("Invalid content type. Only images are allowed"),
];

exports.updateBusinessTypeValidation = [
  body("businessType")
    .isIn(["MANUFACTURER", "RETAILER", "WHOLESALER", "RESELLER"])
    .withMessage(
      "businessType must be one of: MANUFACTURER, RETAILER, WHOLESALER, RESELLER"
    ),
  handleValidationErrors,
];

exports.updateBankDetailsValidation = [
  body("accountNumber").notEmpty().withMessage("accountNumber is required"),
  body("ifscCode").notEmpty().withMessage("ifscCode is required"),
  handleValidationErrors,
];

exports.addPickupLocationValidation = [handleValidationErrors];
