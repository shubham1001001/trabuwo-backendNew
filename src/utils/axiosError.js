const logger = require("../config/logger");

function handleAxiosError(
  error,
  serviceName = "EXTERNAL",
  defaultMessage = "Service call failed",
  ErrorClass
) {
  const message = (msg) => `${defaultMessage}: ${msg}`;

  logger.error(`${serviceName} error`, {
    message: error.message,
    code: error.code,
    response: error.response?.data,
  });

  if (error.code === "ECONNABORTED") {
    throw new ErrorClass(message("Request timed out"), "TIMEOUT", error);
  }

  if (["ENOTFOUND", "EAI_AGAIN"].includes(error.code)) {
    throw new ErrorClass(message("DNS error"), "DNS_ERROR", error);
  }

  if (error.request && !error.response) {
    throw new ErrorClass(
      message("No response from service"),
      "NO_RESPONSE",
      error
    );
  }

  if (error.response) {
    const status = error.response.status;
    const msg = error.response.data?.message || `Status ${status}`;
    throw new ErrorClass(message(msg), "BAD_RESPONSE", error.response.data);
  }

  throw new ErrorClass(message("Unexpected error"), "UNKNOWN", error);
}

module.exports = { handleAxiosError };
