const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const selectProductValidation = [
  body("influencerId")
    .isInt({ min: 1 })
    .withMessage("Valid influencerId is required"),
  body("sellerId").isInt({ min: 1 }).withMessage("Valid sellerId is required"),
  body("productId")
    .isInt({ min: 1 })
    .withMessage("Valid productId is required"),
  body("catalogueId").optional().isInt({ min: 1 }),
  handleValidationErrors,
];

const approveOptInValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid opt-in id is required"),
  body("status").isIn(["APPROVED", "REJECTED"]).withMessage("Invalid status"),
  handleValidationErrors,
];

const addCatalogsValidation = [
  body("catalogues")
    .isArray({ min: 1 })
    .withMessage("catalogues must be a non-empty array"),
  body("catalogues.*.catalogueId")
    .isInt({ min: 1 })
    .withMessage("Valid catalogueId is required for each catalogue"),
  body("catalogues.*.commission")
    .isInt({ min: 0, max: 100 })
    .withMessage("Commission must be between 0 and 100 for each catalogue"),
  handleValidationErrors,
];

const updateCommissionsValidation = [
  body("updates")
    .isArray({ min: 1 })
    .withMessage("updates must be a non-empty array"),
  body("updates.*.id")
    .isInt({ min: 1 })
    .withMessage("Valid id is required for each update"),
  body("updates.*.commission")
    .isInt({ min: 0, max: 100 })
    .withMessage("Commission must be between 0 and 100 for each update"),
  handleValidationErrors,
];

const updateStatusValidation = [
  body("ids").isArray({ min: 1 }).withMessage("ids must be a non-empty array"),
  body("ids.*")
    .isInt({ min: 1 })
    .withMessage("Valid id is required for each item"),
  body("status")
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Status must be either ACTIVE or INACTIVE"),
  handleValidationErrors,
];

const getAllInfluencerPromotionsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Status must be either ACTIVE or INACTIVE"),
  query("catalogueId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("catalogueId must be a positive integer"),
  handleValidationErrors,
];

const getCataloguesNotInPromotionsValidation = [
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
  selectProductValidation,
  approveOptInValidation,
  addCatalogsValidation,
  updateCommissionsValidation,
  updateStatusValidation,
  getAllInfluencerPromotionsValidation,
  getCataloguesNotInPromotionsValidation,
};
