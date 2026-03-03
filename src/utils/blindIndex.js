const crypto = require("crypto");
const config = require("config");

exports.createBlindIndex = (value) => {
  if (!value) {
    return null;
  }

  const salt = config.get("blindIndex.salt");
  if (!salt) {
    throw new Error("Blind index salt not found in config");
  }

  const hmac = crypto.createHmac("sha256", salt);
  hmac.update(value.toString().toLowerCase().trim());
  return hmac.digest("hex");
};
