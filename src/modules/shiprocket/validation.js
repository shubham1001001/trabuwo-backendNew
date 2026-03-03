const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.calculateShippingRatesValidation = [
  body("pickup_postcode")
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("pickup_postcode must be a 6-digit string"),
  body("delivery_postcode")
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("delivery_postcode must be a 6-digit string"),
  body("cod").isInt({ min: 0, max: 1 }).withMessage("cod must be 0 or 1"),
  body("weight")
    .isFloat({ min: 0.1 })
    .withMessage("weight must be a positive number"),
  handleValidationErrors,
];

exports.estimatedDeliveryValidation = [
  body("pickup_postcode")
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("pickup_postcode must be a 6-digit string"),
  body("delivery_postcode")
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("delivery_postcode must be a 6-digit string"),
  body("cod").isInt({ min: 0, max: 1 }).withMessage("cod must be 0 or 1"),
  body("weight")
    .isFloat({ min: 0.1 })
    .withMessage("weight must be a positive number"),
  handleValidationErrors,
];

exports.createOrderValidation = [
  body("orderId")
    .isInt({ min: 1 })
    .withMessage("orderId must be a valid integer"),
  handleValidationErrors,
];

exports.listOrdersValidation = [
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

exports.trackOrderValidation = [
  param("orderId").isString().notEmpty().withMessage("orderId is required"),
  handleValidationErrors,
];

exports.shipOrderValidation = [
  param("orderId").isString().notEmpty().withMessage("orderId is required"),
  body("courierId")
    .isInt({ min: 1 })
    .withMessage("courierId must be a positive integer"),
  handleValidationErrors,
];

exports.schedulePickupValidation = [
  param("orderId").isString().notEmpty().withMessage("orderId is required"),
  body("pickup_date")
    .isISO8601()
    .withMessage("pickup_date must be a valid date"),
  body("pickup_slot")
    .isIn(["9:00-13:00", "13:00-17:00", "17:00-21:00"])
    .withMessage(
      "pickup_slot must be one of: 9:00-13:00, 13:00-17:00, 17:00-21:00"
    ),
  handleValidationErrors,
];

exports.generateLabelValidation = [
  param("orderId").isString().notEmpty().withMessage("orderId is required"),
  handleValidationErrors,
];

exports.cancelOrderValidation = [
  param("orderId").isString().notEmpty().withMessage("orderId is required"),
  handleValidationErrors,
];

exports.getShipmentValidation = [
  param("shipmentId").isUUID().withMessage("shipmentId must be a valid UUID"),
  handleValidationErrors,
];

exports.getShipmentsBySellerValidation = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("offset must be a non-negative integer"),
  query("status")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "intransit",
      "delivered",
      "cancelled",
      "returned",
    ])
    .withMessage("status must be a valid shipment status"),
  handleValidationErrors,
];

exports.getAllShipmentsValidation = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("offset must be a non-negative integer"),
  query("status")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "intransit",
      "delivered",
      "cancelled",
      "returned",
    ])
    .withMessage("status must be a valid shipment status"),
  query("sellerId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("sellerId must be a positive integer"),
  handleValidationErrors,
];

exports.updateShipmentValidation = [
  param("shipmentId").isUUID().withMessage("shipmentId must be a valid UUID"),
  body("status")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "intransit",
      "delivered",
      "cancelled",
      "returned",
    ])
    .withMessage("status must be a valid shipment status"),
  body("awbNumber")
    .optional()
    .isString()
    .withMessage("awbNumber must be a string"),
  body("courierId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("courierId must be a positive integer"),
  body("courierName")
    .optional()
    .isString()
    .withMessage("courierName must be a string"),
  handleValidationErrors,
];

exports.deleteShipmentValidation = [
  param("shipmentId").isUUID().withMessage("shipmentId must be a valid UUID"),
  handleValidationErrors,
];

exports.assignAwbValidation = [
  param("shipmentId").isUUID().withMessage("shipmentId must be a valid UUID"),
  body("courierId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("courierId must be a positive integer"),
  handleValidationErrors,
];

exports.createReturnOrderValidation = [
  body("orderItemPublicId")
    .isUUID()
    .withMessage("orderItemPublicId must be a valid UUID"),
  handleValidationErrors,
];

exports.createExchangeOrderValidation = [
  body("originalOrderItemPublicId")
    .isUUID()
    .notEmpty()
    .withMessage("originalOrderItemPublicId must be a valid UUID"),
  body("newOrderItemPublicId")
    .isUUID()
    .notEmpty()
    .withMessage("newOrderItemPublicId must be a valid UUID"),
  body("sellerPickupLocationId")
    .isString()
    .notEmpty()
    .withMessage("sellerPickupLocationId is required"),
  body("sellerShippingLocationId")
    .isString()
    .notEmpty()
    .withMessage("sellerShippingLocationId is required"),
  body("returnReason")
    .optional()
    .isString()
    .withMessage("returnReason must be a string"),
  body("exchangeDimensions")
    .optional()
    .isObject()
    .withMessage("exchangeDimensions must be an object"),
  body("exchangeDimensions.length")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("exchangeDimensions.length must be a positive number"),
  body("exchangeDimensions.breadth")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("exchangeDimensions.breadth must be a positive number"),
  body("exchangeDimensions.height")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("exchangeDimensions.height must be a positive number"),
  body("exchangeDimensions.weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("exchangeDimensions.weight must be a positive number"),
  body("returnDimensions")
    .optional()
    .isObject()
    .withMessage("returnDimensions must be an object"),
  body("returnDimensions.length")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("returnDimensions.length must be a positive number"),
  body("returnDimensions.breadth")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("returnDimensions.breadth must be a positive number"),
  body("returnDimensions.height")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("returnDimensions.height must be a positive number"),
  body("returnDimensions.weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("returnDimensions.weight must be a positive number"),
  handleValidationErrors,
];

exports.webhookValidation = [
  body("awb")
    .optional()
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (typeof value !== "string" && typeof value !== "number") {
          throw new Error("awb must be a string or number");
        }
      }
      return true;
    }),
  body("order_id")
    .optional()
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (typeof value !== "string" && typeof value !== "number") {
          throw new Error("order_id must be a string or number");
        }
      }
      return true;
    })
    .custom((value, { req }) => {
      if (!value && !req.body.awb) {
        throw new Error("Either awb or order_id is required");
      }
      return true;
    }),
  body("current_status").optional().isString(),
  body("current_status_id").optional().isInt(),
  body("shipment_status").optional().isString(),
  body("shipment_status_id").optional().isInt(),
  body("current_timestamp")
    .optional()
    .custom((value) => {
      if (value !== undefined && value !== null) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error("current_timestamp must be a valid date");
        }
      }
      return true;
    }),
  body("etd")
    .optional()
    .custom((value) => {
      if (value !== undefined && value !== null) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error("etd must be a valid date");
        }
      }
      return true;
    }),
  body("channel_order_id").optional().isString(),
  body("channel").optional().isString(),
  body("courier_name").optional().isString(),
  body("scans").optional().isArray().withMessage("scans must be an array"),
  body("scans.*.date")
    .optional()
    .custom((value) => {
      if (value !== undefined && value !== null) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error("scan date must be a valid date");
        }
      }
      return true;
    }),
  body("scans.*.activity")
    .optional()
    .isString()
    .withMessage("scan activity must be a string"),
  body("scans.*.location").optional().isString(),
  handleValidationErrors,
];
