const { body, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.registerValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain uppercase, lowercase, number and special character"
    ),
  handleValidationErrors,
];

exports.loginValidation = [
  body("email").notEmpty().withMessage("Valid email or mobile is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

exports.loginWithOtpValidation = [
  body("mobile")
    .notEmpty()
    .withMessage("Mobile is required")
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^91\d{10}$/)
    .withMessage("Mobile must be in the format 919234567890"),
  body("otp").notEmpty().withMessage("OTP is required"),
  handleValidationErrors,
];

exports.refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
  handleValidationErrors,
];

exports.logoutValidation = [
  body("refreshToken")
    .optional()
    .notEmpty()
    .withMessage("Refresh token must not be empty if provided"),
  handleValidationErrors,
];

exports.sendOtpValidation = [
  body("mobile")
    .notEmpty()
    .withMessage("Mobile is required")
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^91\d{10}$/)
    .withMessage("Mobile must be in the format 919234567890"),
  handleValidationErrors,
];

exports.verifyOtpValidation = [
  query("mobile")
    .notEmpty()
    .withMessage("Mobile is required")
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^91\d{10}$/)
    .withMessage("Mobile must be in the format 919234567890"),
  query("otp").notEmpty().withMessage("OTP is required"),
  handleValidationErrors,
];

exports.retryOtpValidation = [
  query("mobile")
    .notEmpty()
    .withMessage("Mobile is required")
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^91\d{10}$/)
    .withMessage("Mobile must be in the format 919234567890"),
  query("retrytype")
    .optional()
    .default("voice")
    .isIn(["voice", "text"])
    .withMessage("Retry type must be either 'voice' or 'text'"),
  handleValidationErrors,
];

exports.forgotPasswordValidation = [
  body("mobile")
    .notEmpty()
    .withMessage("Mobile is required")
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^91\d{10}$/)
    .withMessage("Mobile must be in the format 919234567890"),
  body("otp").notEmpty().withMessage("OTP is required"),
  handleValidationErrors,
];

exports.passwordResetValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),
  handleValidationErrors,
];

exports.changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain uppercase, lowercase, number and special character"
    ),
  handleValidationErrors,
];

exports.subscribeEmailValidation = [
  body("type").isIn(["email"]).withMessage("type must be email"),
  body("value").isEmail().withMessage("Valid email is required"),
  handleValidationErrors,
];

exports.subscribeWhatsAppValidation = [
  body("type").isIn(["whatsapp"]).withMessage("type must be whatsapp"),
  body("value")
    .matches(/^91\d{10}$/)
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .withMessage("Mobile must be in the format 919234567890"),
  handleValidationErrors,
];

exports.updateWhatsAppValidation = [
  body("value")
    .matches(/^91\d{10}$/)
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .withMessage("Mobile must be in the format 919234567890"),
  handleValidationErrors,
];


exports.editProfileValidation = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Valid email is required"),

  body("fullName")
    .optional()
    .isString()
    .withMessage("Full name must be string"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female or other"),

  body("dob")
    .optional()
    .isISO8601()
    .withMessage("DOB must be valid date"),

  body("maritalStatus")
    .optional()
    .isIn(["single", "married", "divorced", "widowed"])
    .withMessage("Invalid marital status"),

  body("numberOfKids")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Number of kids must be positive number"),

  body("occupation").optional().isString(),
  body("education").optional().isString(),
  body("monthlyIncome").optional().isNumeric(),
  body("aboutMe").optional().isString(),
  body("languageSpoken").optional().isString(),
  body("profileImage").optional().isString(),

  handleValidationErrors,
];