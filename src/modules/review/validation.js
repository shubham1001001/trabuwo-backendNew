const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createValidation = [
  body("orderItemId").isUUID().withMessage("orderItemId must be a UUID"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be 1-5"),
  body("title").optional().isString().isLength({ max: 120 }),
  body("text").optional().isString().isLength({ max: 5000 }),
  body("images").optional().isArray(),
  body("images.*.imageUrl").optional().isURL(),
  body("images.*.imageKey").optional().isString(),
  body("images.*.altText").optional().isString(),
  body("images.*.sortOrder").optional().isInt({ min: 0 }),
  handleValidationErrors,
];

exports.updateValidation = [
  param("id").isUUID(4).withMessage("id must be a UUID"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("rating must be 1-5"),
  body("title").optional().isString().isLength({ max: 120 }),
  body("text").optional().isString().isLength({ max: 5000 }),
  body("images").optional().isArray(),
  body("images.*.imageUrl").optional().isURL(),
  body("images.*.imageKey").optional().isString(),
  body("images.*.altText").optional().isString(),
  body("images.*.sortOrder").optional().isInt({ min: 0 }),
  handleValidationErrors,
];

exports.deleteValidation = [
  param("id").isUUID(4).withMessage("id must be a UUID"),
  handleValidationErrors,
];

exports.productListValidation = [
  param("productId").isUUID().withMessage("productId must be a UUID"),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 10 }),
  query("sort").optional().isIn(["newest", "highest", "lowest"]),
  handleValidationErrors,
];

exports.myListValidation = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 10 }),
  handleValidationErrors,
];

exports.generatePresignedUrlValidation = [
  body("fileName").notEmpty().isString(),
  body("contentType")
    .notEmpty()
    .isString()
    .matches(/^image\/(jpeg|jpg|png|gif|webp)$/),
  handleValidationErrors,
];

exports.helpfulValidation = [
  param("id").isUUID(4).withMessage("id must be a UUID"),
  handleValidationErrors,
];

exports.storeListValidation = [
  param("storeId").isUUID(4).withMessage("storeId must be a UUID"),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 10 }),
  handleValidationErrors,
];

exports.storeHistogramValidation = [
  param("storeId").isUUID(4).withMessage("storeId must be a UUID"),
  handleValidationErrors,
];
