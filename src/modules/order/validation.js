const { param, query, body } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.getOrderValidation = [
  param("id").isUUID().withMessage("Order ID must be a valid UUID"),
  handleValidationErrors,
];

exports.getOrdersValidation = [
  query("status")
    .optional()
    .isIn(["pending", "ready_to_ship", "shipped", "cancelled"])
    .withMessage(
      "Status must be one of: pending, ready_to_ship, shipped, cancelled"
    ),
  query("productName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("productName must be a string between 1 and 100 characters"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  handleValidationErrors,
];

exports.acceptOrderValidation = [
  param("id").isUUID().withMessage("Order ID must be a valid UUID"),
  handleValidationErrors,
];

exports.acceptOrderPostValidation = [
  param("orderPublicId")
    .isUUID()
    .withMessage("Order public ID must be a valid UUID"),
  handleValidationErrors,
];

exports.cancelOrderValidation = [
  param("id").isUUID().withMessage("Order ID must be a valid UUID"),
  handleValidationErrors,
];

exports.downloadShippingLabelValidation = [
  param("id").isUUID().withMessage("Order ID must be a valid UUID"),
  handleValidationErrors,
];

exports.orderFiltersValidation = [
  query("status")
    .optional()
    .isIn(["on_hold", "pending", "ready_to_ship", "shipped", "cancelled"])
    .withMessage("Invalid order status"),
  query("productName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Product name must be between 1 and 100 characters"),
  query("skuId")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("SKU ID must be between 1 and 50 characters"),
  query("startDispatchDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start dispatch date format"),
  query("endDispatchDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end dispatch date format"),
  query("startSlaDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start SLA date format"),
  query("endSlaDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end SLA date format"),
  query("slaStatus")
    .optional()
    .isIn(["breached", "breaching_soon", "other"])
    .withMessage("Invalid SLA status"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 15 })
    .withMessage("Limit must be between 1 and 15"),
  handleValidationErrors,
];

exports.getBuyerOrdersValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

exports.getBuyerOrderByIdValidation = [
  param("id").isUUID().withMessage("Order ID must be a valid UUID"),
  handleValidationErrors,
];

exports.cancelOrderByBuyerValidation = [
  param("id").isUUID().withMessage("Order ID must be a valid UUID"),
  handleValidationErrors,
];

exports.buyNowValidation = [
  body("productVariantId")
    .isUUID()
    .withMessage("Product variant ID must be a valid UUID"),
  body("userAddressPublicId")
    .isUUID()
    .withMessage("User address ID must be a valid UUID"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than 0"),
  handleValidationErrors,
];

exports.checkoutValidation = [
  body("userAddressPublicId")
    .isUUID()
    .withMessage("User address ID must be a valid UUID"),
  handleValidationErrors,
];
