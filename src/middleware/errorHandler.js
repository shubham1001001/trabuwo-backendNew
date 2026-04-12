const logger = require("../config/logger");
const ApiError = require("../utils/ApiError");
const {
  Msg91Error,
  ShiprocketError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ResourceCreationError,
  ConflictError,
} = require("../utils/errors");
const {
  UniqueConstraintError,
  ValidationError: SequelizeValidationError,
  ForeignKeyConstraintError,
  DatabaseError: SequelizeDatabaseError,
  TimeoutError,
  ConnectionError,
} = require("sequelize");

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  logger.error(err);

  if (err.name === "MulterError") {
    let message = err.message;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Maximum size allowed is 50MB.";
    }
    return ApiError.send(res, new ApiError(400, message, "FILE_UPLOAD_ERROR"));
  }

  if (err instanceof Msg91Error) {
    return ApiError.send(
      res,
      new ApiError(err?.response?.status, err.message, err.code)
    );
  }

  if (err instanceof ShiprocketError) {
    return ApiError.send(
      res,
      new ApiError(err?.response?.status, err.message, err.code)
    );
  }

  if (err instanceof ValidationError) {
    return ApiError.send(
      res,
      new ApiError(400, err.message, err.code, err.details)
    );
  }

  if (err instanceof NotFoundError) {
    return ApiError.send(
      res,
      new ApiError(404, err.message, err.code, err.details)
    );
  }

  if (err instanceof ResourceCreationError) {
    return ApiError.send(
      res,
      new ApiError(400, err.message, err.code, err.details)
    );
  }

  if (err instanceof AuthenticationError) {
    return ApiError.send(
      res,
      new ApiError(401, err.message, err.code, err.details)
    );
  }

  if (err instanceof ConflictError) {
    return ApiError.send(
      res,
      new ApiError(409, err.message, err.code, err.details)
    );
  }

  if (err instanceof ApiError) {
    return ApiError.send(res, err);
  }

  if (err instanceof UniqueConstraintError) {
    return ApiError.send(
      res,
      new ApiError(
        409,
        err.errors[0]?.message || "Unique constraint error",
        "UNIQUE_CONSTRAINT_ERROR",
        { field: err.errors[0]?.path, value: err.errors[0]?.value }
      )
    );
  }

  if (err instanceof SequelizeValidationError) {
    return ApiError.send(
      res,
      new ApiError(400, err.message, "SEQUELIZE_VALIDATION_ERROR", err.errors)
    );
  }

  if (err instanceof ForeignKeyConstraintError) {
    return ApiError.send(
      res,
      new ApiError(
        400,
        "Foreign key constraint error",
        "FOREIGN_KEY_CONSTRAINT_ERROR",
        err.message
      )
    );
  }

  if (err instanceof SequelizeDatabaseError) {
    console.error('DATABASE_ERROR_DETAILS:', err.parent || err);
    return ApiError.send(
      res,
      new ApiError(500, "Database error", "DATABASE_ERROR", err.message)
    );
  }

  if (err instanceof TimeoutError || err instanceof ConnectionError) {
    return ApiError.send(
      res,
      new ApiError(
        503,
        "Database connection error",
        "DATABASE_CONNECTION_ERROR",
        err.message
      )
    );
  }

  logger.error("Unknown error:", err);
  const unknownError = new ApiError(
    500,
    "Internal Server Error. Please try again later.",
    "INTERNAL_ERROR"
  );
  return ApiError.send(res, unknownError);
};
