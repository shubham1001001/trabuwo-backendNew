const crypto = require("crypto");
const config = require("config");
const { Buffer } = require("buffer");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const getKeyByVersion = (version = 1) => {
  const key = config.get(`encryption.keys.${version}`);
  if (!key) {
    throw new Error(`Encryption key version ${version} not found in config`);
  }

  const keyBuffer = Buffer.from(key, "base64");
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `Encryption key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits). Got ${keyBuffer.length} bytes.`
    );
  }

  return keyBuffer;
};

const getDefaultKeyVersion = () => {
  return config.get("encryption.defaultKeyVersion") || 1;
};

exports.encrypt = (text, keyVersion = null) => {
  if (!text) {
    return null;
  }

  const version = keyVersion || getDefaultKeyVersion();
  const key = getKeyByVersion(version);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();

  const ivBase64 = iv.toString("base64");
  const tagBase64 = tag.toString("base64");
  const ciphertextBase64 = encrypted.toString("base64");

  return `${ivBase64}:${tagBase64}:${ciphertextBase64}`;
};

exports.decrypt = (encryptedString, keyVersion = null) => {
  if (!encryptedString) {
    return null;
  }

  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted string format. Expected iv:tag:ciphertext");
  }

  const [ivBase64, tagBase64, ciphertextBase64] = parts;

  let version = keyVersion;
  if (!version) {
    version = getDefaultKeyVersion();
  }

  const key = getKeyByVersion(version);

  const iv = Buffer.from(ivBase64, "base64");
  const tag = Buffer.from(tagBase64, "base64");
  const encrypted = Buffer.from(ciphertextBase64, "base64");

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes, got ${iv.length}`);
  }

  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Invalid tag length. Expected ${TAG_LENGTH} bytes, got ${tag.length}`);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
};

exports.getKeyByVersion = getKeyByVersion;
exports.getDefaultKeyVersion = getDefaultKeyVersion;
