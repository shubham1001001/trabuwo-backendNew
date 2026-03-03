const { body } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.upsertBankDetailsValidation = [
  body("accountNumber")
    .notEmpty()
    .withMessage("Account number is required")
    .isString()
    .withMessage("Account number must be a string")
    .isLength({ min: 9, max: 18 })
    .withMessage("Account number must be between 9 and 18 characters")
    .matches(/^\d+$/)
    .withMessage("Account number must contain only digits"),

  body("ifsc")
    .notEmpty()
    .withMessage("IFSC code is required")
    .isString()
    .withMessage("IFSC code must be a string")
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("IFSC code must be in format: AAAA0XXXXXX (4 letters, 0, 6 alphanumeric)"),

  body("accountHolderName")
    .notEmpty()
    .withMessage("Account holder name is required")
    .isString()
    .withMessage("Account holder name must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Account holder name must be between 2 and 100 characters")
    .trim(),

  handleValidationErrors,
];

exports.upsertUpiDetailsValidation = [
  body("upiId")
    .notEmpty()
    .withMessage("UPI ID is required")
    .isString()
    .withMessage("UPI ID must be a string")
    .matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)
    .withMessage("UPI ID must be in format: user@provider (e.g., user@paytm, 9876543210@upi)"),

  body("upiName")
    .notEmpty()
    .withMessage("UPI name is required")
    .isString()
    .withMessage("UPI name must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("UPI name must be between 2 and 100 characters")
    .trim(),

  handleValidationErrors,
];
