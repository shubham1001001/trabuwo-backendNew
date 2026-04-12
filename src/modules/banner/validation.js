const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const createBannerValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Banner title is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Banner title must be between 2 and 100 characters"),
  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Banner description must not exceed 500 characters"),
  body("section").isIn(["home"]).withMessage("Section must be one of: home"),
  body("position")
    .isInt({ min: 1 })
    .withMessage("Position must be a positive integer"),
  body("isActive")
    .optional({ checkFalsy: true })
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  body("startTime")
    .isISO8601()
    .withMessage("startTime must be a valid ISO 8601 date")
    .custom((value) => {
      if (!value.endsWith("Z") && !value.endsWith("+00:00"))
        throw new Error("Time must be in UTC");
      const startDate = new Date(value);
      const now = new Date();
      // Allow for a 1-minute grace period
      if (startDate < new Date(now.getTime() - 60000)) {
        throw new Error("startTime cannot be in the past");
      }
      return true;
    }),
  body("endTime")
    .isISO8601()
    .withMessage("endTime must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (!value.endsWith("Z")) throw new Error("Time must be in UTC");
      const endDate = new Date(value);
      const startDate = new Date(req.body.startTime);
      if (endDate <= startDate) {
        throw new Error("endTime must be after startTime");
      }
      return true;
    }),
  body("clickUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("clickUrl must be a valid URL"),
  handleValidationErrors,
];

const updateBannerValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Banner ID must be a positive integer"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Banner title cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Banner title must be between 2 and 100 characters"),
  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Banner description must not exceed 500 characters"),
  body("section")
    .optional()
    .isIn(["home"])
    .withMessage("Section must be one of: home"),
  body("position")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Position must be a positive integer"),
  body("isActive")
    .optional({ checkFalsy: true })
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  body("startTime")
    .optional()
    .isISO8601()
    .withMessage("startTime must be a valid ISO 8601 date")
    .custom((value) => {
      if (!value.endsWith("Z") && !value.endsWith("+00:00"))
        throw new Error("Time must be in UTC");
      const startDate = new Date(value);
      const now = new Date();
      // Allow for a 1-minute grace period
      if (startDate < new Date(now.getTime() - 60000)) {
        throw new Error("startTime cannot be in the past");
      }
      return true;
    }),
  body("endTime")
    .optional()
    .isISO8601()
    .withMessage("endTime must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (!value.endsWith("Z") && !value.endsWith("+00:00"))
        throw new Error("Time must be in UTC");
      const endDate = new Date(value);
      const startDate = req.body.startTime
        ? new Date(req.body.startTime)
        : null;
      if (!startDate) {
        return true;
      }
      if (endDate <= startDate) {
        throw new Error("endTime must be after startTime");
      }
      return true;
    }),
  body("clickUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("clickUrl must be a valid URL"),
  handleValidationErrors,
];

const getBannerByIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Banner ID must be a positive integer"),
  handleValidationErrors,
];

const getBannersBySectionValidation = [
  param("section").isIn(["home"]).withMessage("Section must be one of: home"),
  handleValidationErrors,
];

const softDeleteBannerValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Banner ID must be a positive integer"),
  handleValidationErrors,
];

const activateDeactivateBannerValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Banner ID must be a positive integer"),
  body("isActive").isBoolean().withMessage("isActive must be a boolean value"),
  handleValidationErrors,
];

const getAllBannersValidation = [
  query("section")
    .optional()
    .isIn(["home"])
    .withMessage("Section must be one of: home"),
  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
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

const bulkUpdateBannersValidation = [
  body("updates")
    .isArray({ min: 1 })
    .withMessage("Updates must be a non-empty array"),
  body("updates.*.id")
    .isInt({ min: 1 })
    .withMessage("Each update must have a valid banner ID"),
  body("updates.*.title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Banner title must be between 2 and 100 characters"),
  body("updates.*.position")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Position must be a positive integer"),
  body("updates.*.isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  handleValidationErrors,
];

module.exports = {
  createBannerValidation,
  updateBannerValidation,
  getBannerByIdValidation,
  getBannersBySectionValidation,
  softDeleteBannerValidation,
  activateDeactivateBannerValidation,
  getAllBannersValidation,
  bulkUpdateBannersValidation,
};
