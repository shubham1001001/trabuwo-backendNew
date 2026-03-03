const jwt = require("jsonwebtoken");
const config = require("config");
const ApiError = require("../utils/ApiError");

module.exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "No token provided", "UNAUTHORIZED"));
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req.user = decoded;
    next();
  } catch (error) {
    return next(new ApiError(401, "Invalid token", "UNAUTHORIZED", error));
  }
};

module.exports.attachUserIfPresent = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req.user = decoded;
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    // Ignore invalid token for public routes
  }
  next();
};

module.exports.requireRole =
  (...roles) =>
  (req, res, next) => {
    if (
      !req.user ||
      !Array.isArray(req.user.roles) ||
      !req.user.roles.some((r) => roles.includes(r))
    ) {
      return next(
        new ApiError(403, "Forbidden: insufficient role", "FORBIDDEN")
      );
    }
    next();
  };
