const { body, query, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const createPromotionValidation = [
  body("name")
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters"),
  body("type")
    .isIn([
      "SALE_EVENTS",
      "DAILY_DEALS",
      "FLASH_EVENTS",
      "WISHCART_AND_CART_OFFERS",
    ])
    .withMessage("Invalid promotion type"),
  body("description").optional().isString(),
  body("startDate")
    .isISO8601()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Start date must be in the future");
      }
      return true;
    }),
  body("endDate")
    .isISO8601()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  body("discountType")
    .isIn(["PERCENTAGE", "FIXED_AMOUNT"])
    .withMessage("Invalid discount type"),
  body("discountValue")
    .isNumeric()
    .custom((value, { req }) => {
      if (
        req.body.discountType === "PERCENTAGE" &&
        (value < 0 || value > 100)
      ) {
        throw new Error("Discount percentage must be between 0 and 100");
      }
      if (req.body.discountType === "FIXED_AMOUNT" && value <= 0) {
        throw new Error("Fixed discount amount must be positive");
      }
      return true;
    }),
  body("minOrderValue").optional().isNumeric().isFloat({ min: 0 }),
  body("maxDiscount").optional().isNumeric().isFloat({ min: 0 }),
  handleValidationErrors,
];

const updatePromotionValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  body("name").optional().isString().isLength({ min: 3, max: 100 }),
  body("type")
    .optional()
    .isIn([
      "SALE_EVENTS",
      "DAILY_DEALS",
      "FLASH_EVENTS",
      "WISHCART_AND_CART_OFFERS",
    ]),
  body("description").optional().isString(),
  body("startDate")
    .isISO8601()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Start date must be in the future");
      }
      return true;
    }),
  body("endDate")
    .isISO8601()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  body("status").optional().isIn(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED"]),
  body("discountType").optional().isIn(["PERCENTAGE", "FIXED_AMOUNT"]),
  body("discountValue")
    .isNumeric()
    .custom((value, { req }) => {
      if (
        req.body.discountType === "PERCENTAGE" &&
        (value < 0 || value > 100)
      ) {
        throw new Error("Discount percentage must be between 0 and 100");
      }
      if (req.body.discountType === "FIXED_AMOUNT" && value <= 0) {
        throw new Error("Fixed discount amount must be positive");
      }
      return true;
    }),
  body("minOrderValue").optional().isNumeric().isFloat({ min: 0 }),
  body("maxDiscount").optional().isNumeric().isFloat({ min: 0 }),
  body("isActive").optional().isBoolean(),
  handleValidationErrors,
];

const registerSellerValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  handleValidationErrors,
];

const updatePromotionStatusValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  body("status")
    .isIn(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED"])
    .withMessage("Invalid status"),
  handleValidationErrors,
];

const addProductValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  body("productId").isUUID().withMessage("Valid product ID is required"),
  body("discountPercent")
    .isInt({ min: 0, max: 100 })
    .withMessage("Discount percent must be between 0 and 100"),
  body("returnDefectiveDiscountPercent")
    .isInt({ min: 0, max: 100 })
    .withMessage("Return/defective discount percent must be between 0 and 100"),
  handleValidationErrors,
];

const addMultipleProductsValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  body("products")
    .isArray({ min: 1 })
    .withMessage("Products array is required with at least one product"),
  body("products.*.productId")
    .isUUID()
    .withMessage("Valid product ID is required for each product"),
  body("products.*.discountPercent")
    .isInt({ min: 0, max: 100 })
    .withMessage("Discount percent must be between 0 and 100 for each product"),
  body("products.*.returnDefectiveDiscountPercent")
    .isInt({ min: 0, max: 100 })
    .withMessage(
      "Return/defective discount percent must be between 0 and 100 for each product"
    ),
  handleValidationErrors,
];

const updateMultipleProductDiscountsValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  body("products")
    .isArray({ min: 1 })
    .withMessage("Products array is required with at least one product"),
  body("products.*.productId")
    .isUUID()
    .withMessage("Valid product ID is required for each product"),
  body("products.*.discountPercent")
    .isInt({ min: 0, max: 100 })
    .withMessage("Discount percent must be between 0 and 100 for each product"),
  body("products.*.returnDefectiveDiscountPercent")
    .isInt({ min: 0, max: 100 })
    .withMessage(
      "Return/defective discount percent must be between 0 and 100 for each product"
    ),
  handleValidationErrors,
];

const removeMultipleProductsValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  body("productIds")
    .isArray({ min: 1 })
    .withMessage("Product IDs array is required with at least one product ID"),
  body("productIds.*")
    .isUUID()
    .withMessage("Valid product ID is required for each item"),
  handleValidationErrors,
];

const getPromotionValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  handleValidationErrors,
];

const getPromotionSellersValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  handleValidationErrors,
];

const getPromotionProductsValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  handleValidationErrors,
];

const approveRejectSellerValidation = [
  param("id").isInt().withMessage("Invalid promotion ID"),
  param("sellerId").isInt().withMessage("Invalid seller ID"),
  handleValidationErrors,
];

const getAllPromotionsValidation = [
  query("status").optional().isIn(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED"]),
  query("type")
    .optional()
    .isIn([
      "SALE_EVENTS",
      "DAILY_DEALS",
      "FLASH_EVENTS",
      "WISHCART_AND_CART_OFFERS",
    ]),
  query("isActive").optional().isIn(["true", "false"]),
  handleValidationErrors,
];

const getProductsNotInPromotionsValidation = [
  param("promotionId")
    .isInt({ min: 1 })
    .withMessage("Promotion ID must be a positive integer"),
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

module.exports = {
  createPromotionValidation,
  updatePromotionValidation,
  registerSellerValidation,
  updatePromotionStatusValidation,
  addProductValidation,
  addMultipleProductsValidation,
  updateMultipleProductDiscountsValidation,
  removeMultipleProductsValidation,
  getPromotionValidation,
  getPromotionSellersValidation,
  getPromotionProductsValidation,
  approveRejectSellerValidation,
  getAllPromotionsValidation,
  getProductsNotInPromotionsValidation,
};
