const { Buffer } = require("buffer");

class CursorHelper {
  static encodeCursor(publicId) {
    return Buffer.from(publicId).toString("base64");
  }
  static decodeCursor(cursorString) {
    try {
      if (!cursorString) return null;
      return Buffer.from(cursorString, "base64").toString();
    } catch {
      return null;
    }
  }
}

module.exports = CursorHelper;
