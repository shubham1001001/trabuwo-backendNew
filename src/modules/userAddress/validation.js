const { body, param } = require("express-validator");

exports.createAddressValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("en-IN")
    .withMessage("Invalid phone number format"),

  body("pincode")
    .notEmpty()
    .withMessage("Pincode is required")
    .isPostalCode("IN")
    .withMessage("Invalid pincode format"),

  body("city")
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("state")
    .notEmpty()
    .withMessage("State is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),

  body("buildingNumber")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Building number must not exceed 50 characters"),

  body("street")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Street must not exceed 100 characters"),

  body("landmark")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Landmark must not exceed 100 characters"),

  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("Address type must be home, work, or other"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean value"),
];

exports.updateAddressValidation = [
  param("publicId").isUUID().withMessage("Invalid address ID format"),

  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("phoneNumber")
    .optional()
    .isMobilePhone("en-IN")
    .withMessage("Invalid phone number format"),

  body("pincode")
    .optional()
    .isPostalCode("IN")
    .withMessage("Invalid pincode format"),

  body("city")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("state")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),

  body("buildingNumber")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Building number must not exceed 50 characters"),

  body("street")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Street must not exceed 100 characters"),

  body("landmark")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Landmark must not exceed 100 characters"),

  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("Address type must be home, work, or other"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean value"),
];

exports.setDefaultValidation = [
  param("publicId").isUUID().withMessage("Invalid address ID format"),
];

exports.getAddressValidation = [
  param("publicId").isUUID().withMessage("Invalid address ID format"),
];

exports.deleteAddressValidation = [
  param("publicId").isUUID().withMessage("Invalid address ID format"),
];
