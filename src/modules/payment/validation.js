const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createPaymentOrderValidation = [
  body("orderId").isUUID().withMessage("orderId must be a valid UUID"),
  body("amount")
    .isFloat({ min: 1 })
    .withMessage("amount must be a positive number"),
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string"),
  handleValidationErrors,
];


exports.verifyPaymentValidation = [
  body("orderId").isUUID().withMessage("orderId must be a valid UUID"),
  body("gatewayPaymentId")
    .notEmpty()
    .withMessage("gatewayPaymentId is required"),
  body("signature").notEmpty().withMessage("signature is required"),
  handleValidationErrors,
];

exports.getPaymentValidation = [
  param("paymentId").isUUID().withMessage("paymentId must be a valid UUID"),
  handleValidationErrors,
];

exports.createRefundValidation = [
  param("id")
    .notEmpty()
    .withMessage("Payment ID is required")
    .isString()
    .withMessage("Payment ID must be a string")
    .matches(/^pay_/)
    .withMessage("Payment ID must be a valid Razorpay payment ID"),
  body("amount")
    .optional()
    .isInt({ min: 100 })
    .withMessage("Amount must be at least ₹1.00 (100 paise) and in smallest currency unit"),
  body("speed")
    .optional()
    .isIn(["normal", "optimum"])
    .withMessage("Speed must be either 'normal' or 'optimum'"),
  body("notes")
    .optional()
    .isObject()
    .withMessage("Notes must be an object")
    .custom((value) => {
      if (value && Object.keys(value).length > 15) {
        throw new Error("Notes can have maximum 15 key-value pairs");
      }
      return true;
    }),
  body("receipt")
    .optional()
    .isString()
    .withMessage("Receipt must be a string"),
  handleValidationErrors,
];
