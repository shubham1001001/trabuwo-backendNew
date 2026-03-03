const { body, query, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.createLeaveRequestValidation = [
  body("startDate")
    .isISO8601()
    .withMessage("Start date must be a valid date")
    .notEmpty()
    .withMessage("Start date is required"),
  body("endDate")
    .isISO8601()
    .withMessage("End date must be a valid date")
    .notEmpty()
    .withMessage("End date is required")
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  body("reason")
    .isIn([
      "unable_to_process_due_to_lockdown",
      "manpower_issue",
      "limited_inventory_stock_issue",
      "production_issue",
      "limited_packaging_materials_issue",
      "personal_reasons",
      "festive_holidays",
      "staff_self_suffering_from_covid",
      "local_strike",
    ])
    .withMessage("Invalid reason provided"),
  handleValidationErrors,
];

exports.updateLeaveRequestValidation = [
  param("id").isInt().withMessage("Invalid leave request ID"),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  body("reason")
    .optional()
    .isIn([
      "unable_to_process_due_to_lockdown",
      "manpower_issue",
      "limited_inventory_stock_issue",
      "production_issue",
      "limited_packaging_materials_issue",
      "personal_reasons",
      "festive_holidays",
      "staff_self_suffering_from_covid",
      "local_strike",
    ])
    .withMessage("Invalid reason provided"),
  handleValidationErrors,
];

exports.getLeaveRequestByIdValidation = [
  param("id").isInt().withMessage("Invalid leave request ID"),
  handleValidationErrors,
];

exports.deleteLeaveRequestValidation = [
  param("id").isInt().withMessage("Invalid leave request ID"),
  handleValidationErrors,
];

exports.getLeaveRequestsValidation = [
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
