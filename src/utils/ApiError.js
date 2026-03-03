class ApiError extends Error {
  constructor(
    status = 500,
    message = "An error occurred",
    code = null,
    details = null
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static send(res, error) {
    const status = error.status || 500;
    // const isProduction = process.env.NODE_ENV === "production";

    const response = {
      success: false,
      message: error.message || "An error occurred",
      code: error.code || null,
      details: error.details || null,
    };

    // if (!isProduction) {
    //   response.details = error.details || null;
    // }

    return res.status(status).json(response);
  }
}

module.exports = ApiError;
