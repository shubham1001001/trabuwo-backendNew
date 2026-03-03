const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ApiError(400, "Validation error", "VALIDATION_ERROR", errors.array())
    );
  }
  next();
};
