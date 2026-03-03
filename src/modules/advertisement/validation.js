const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const createCampaignValidation = [
  body("name")
    .notEmpty()
    .withMessage("Campaign name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Campaign name must be between 1 and 255 characters"),

  body("start")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  body("end")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),

  body("status")
    .optional()
    .isIn(["live", "paused", "upcoming"])
    .withMessage("Status must be one of: live, paused, upcoming"),

  body("totalBudget")
    .notEmpty()
    .withMessage("Total budget is required")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Total budget must be a valid decimal number"),

  body("bidType")
    .notEmpty()
    .withMessage("Bid type is required")
    .isIn(["cost_per_click", "cost_per_ad_order"])
    .withMessage("Bid type must be either cost_per_click or cost_per_ad_order"),

  body("dailyBudget")
    .notEmpty()
    .withMessage("Daily budget is required")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Daily budget must be a valid decimal number"),

  body("catalogues")
    .isArray({ min: 1 })
    .withMessage("At least one catalogue is required"),

  body("catalogues.*.catalogueId")
    .isInt({ min: 1 })
    .withMessage("Catalogue ID must be a positive integer"),

  body("catalogues.*.costPerClick")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Cost per click must be a valid decimal number"),
  handleValidationErrors,
];

const updateCampaignValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Campaign ID must be a positive integer"),

  body("name")
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage("Campaign name must be between 1 and 255 characters"),

  body("start")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  body("end")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),

  body("status")
    .optional()
    .isIn(["live", "paused", "upcoming"])
    .withMessage("Status must be one of: live, paused, upcoming"),

  body("totalBudget")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Total budget must be a valid decimal number"),

  body("bidType")
    .optional()
    .isIn(["cost_per_click", "cost_per_ad_order"])
    .withMessage("Bid type must be either cost_per_click or cost_per_ad_order"),

  body("dailyBudget")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Daily budget must be a valid decimal number"),
  handleValidationErrors,
];

const campaignIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Campaign ID must be a positive integer"),
  handleValidationErrors,
];

const updateCampaignCatalogueValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Campaign catalogue ID must be a positive integer"),

  body("costPerClick")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Cost per click must be a valid decimal number"),
  handleValidationErrors,
];

const campaignCatalogueIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Campaign catalogue ID must be a positive integer"),
];

const campaignCatalogueByCampaignIdValidation = [
  param("campaignId")
    .isInt({ min: 1 })
    .withMessage("Campaign ID must be a positive integer"),
];

const getAllCampaignsValidation = [
  query("status")
    .optional()
    .isIn(["live", "paused", "upcoming"])
    .withMessage("Status must be one of: live, paused, upcoming"),
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

const getAvailableCataloguesValidation = [
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

const restartCampaignValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Campaign ID must be a positive integer"),

  body("catalogueData")
    .isArray({ min: 1 })
    .withMessage("At least one catalogue must be provided"),

  body("catalogueData.*.campaignCatalogueId")
    .isInt({ min: 1 })
    .withMessage("Campaign catalogue ID must be a positive integer"),

  body("catalogueData.*.costPerClick")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Cost per click must be a valid decimal number"),
  handleValidationErrors,
];

module.exports = {
  createCampaignValidation,
  updateCampaignValidation,
  campaignIdValidation,
  updateCampaignCatalogueValidation,
  campaignCatalogueIdValidation,
  campaignCatalogueByCampaignIdValidation,
  getAllCampaignsValidation,
  getAvailableCataloguesValidation,
  restartCampaignValidation,
};
