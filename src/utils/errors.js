class AppError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, "VALIDATION_ERROR", details);
  }
}

class AuthenticationError extends AppError {
  constructor(message, details = null) {
    super(message, "AUTHENTICATION_ERROR", details);
  }
}

class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, "NOT_FOUND_ERROR", details);
  }
}

class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, "CONFLICT_ERROR", details);
  }
}

class ResourceCreationError extends AppError {
  constructor(message, details = null) {
    super(message, "RESOURCE_CREATION_ERROR", details);
  }
}

class ExternalServiceError extends AppError {
  constructor(message, service, details = null) {
    super(message, `${service.toUpperCase()}_ERROR`, details);
    this.service = service;
  }
}

class DatabaseError extends AppError {
  constructor(message, details = null) {
    super(message, "DATABASE_ERROR", details);
  }
}

class Msg91Error extends ExternalServiceError {
  constructor(message, type = "GENERAL", details = null) {
    super(message, "MSG91", details);
    this.msg91Type = type;
  }
}

class ShiprocketError extends ExternalServiceError {
  constructor(message, type = "GENERAL", details = null) {
    super(message, "SHIPROCKET", details);
    this.shiprocketType = type;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ExternalServiceError,
  DatabaseError,
  Msg91Error,
  ShiprocketError,
  ResourceCreationError,
  ConflictError,
};
