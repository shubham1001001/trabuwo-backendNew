const { query, param, body } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.getAvailableSlotsValidation = [
  query("language")
    .optional()
    .isIn(["ENGLISH", "HINDI"])
    .withMessage("Language must be ENGLISH or HINDI"),
  query("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in ISO 8601 format (YYYY-MM-DD)"),
  handleValidationErrors,
];

exports.bookTrainingSlotValidation = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("Slot ID must be a positive integer"),
  handleValidationErrors,
];

exports.createTrainingSlotValidation = [
  body("language")
    .isIn(["ENGLISH", "HINDI"])
    .withMessage("Language must be ENGLISH or HINDI"),
  body("startTimestamp")
    .isISO8601()
    .withMessage("Start timestamp must be in ISO 8601 format"),
  body("endTimestamp")
    .isISO8601()
    .withMessage("End timestamp must be in ISO 8601 format"),
  handleValidationErrors,
];
