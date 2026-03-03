const sharp = require("sharp");
const { ValidationError } = require("./errors");

const DEFAULT_QUALITY = 100;

/**
 * Sanitizes a filename for use in S3 keys
 * Removes extension, converts to lowercase, replaces special chars with hyphens
 * @param {string} originalName - Original filename
 * @returns {string} Sanitized filename without extension
 */
function sanitizeFileName(originalName) {
  if (!originalName) {
    return "image";
  }

  // Remove extension
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");

  // Replace spaces and special characters with hyphens
  // Keep only alphanumeric, hyphens, and underscores
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  // Limit length to 100 characters
  const truncated = sanitized.substring(0, 100);

  return truncated || "image";
}

/**
 * Converts an image buffer to WebP format
 * @param {Buffer} buffer - Image buffer to convert
 * @param {number} quality - WebP quality (0-100), default 100
 * @param {string} mimeType - Optional mimeType to detect SVG
 * @returns {Promise<Buffer>} WebP formatted buffer
 */
async function convertToWebP(
  buffer,
  quality = DEFAULT_QUALITY,
  mimeType = null,
  width = 1024,
  height = 1024
) {
  try {
    let sharpInstance = sharp(buffer);

    // Detect SVG and rasterize at high resolution for better quality
    const isSVG = mimeType === "image/svg+xml" || mimeType === "image/svg";
    if (isSVG) {
      // Rasterize SVG at 1024px for good quality in card displays
      sharpInstance = sharpInstance.resize(width, height, {
        // fit: "inside",
        withoutEnlargement: false,
      });
    }

    // Convert to WebP with quality settings
    return await sharpInstance.webp({ quality }).toBuffer();
  } catch (error) {
    throw new ValidationError(
      `Failed to convert image to WebP: ${error.message}`
    );
  }
}

/**
 * Converts an image buffer to WebP format with optional resizing
 * @param {Buffer} buffer - Image buffer to convert
 * @param {Object} options - Processing options
 * @param {number} options.quality - WebP quality (0-100), default 100
 * @param {number} options.width - Optional width for resizing
 * @param {number} options.height - Optional height for resizing
 * @param {boolean} options.withoutEnlargement - Prevent enlarging images, default true
 * @param {string} options.mimeType - Optional mimeType to detect SVG
 * @returns {Promise<Buffer>} WebP formatted buffer
 */
async function processImageForUpload(buffer, options = {}) {
  try {
    const {
      quality = DEFAULT_QUALITY,
      width,
      height,
      withoutEnlargement = true,
      mimeType = null,
    } = options;

    let sharpInstance = sharp(buffer);

    // Detect SVG and handle rasterization
    const isSVG = mimeType === "image/svg+xml" || mimeType === "image/svg";

    if (isSVG) {
      // For SVG: use specified size if provided, otherwise use 1024px
      const targetWidth = width || 1024;
      const targetHeight = height || 1024;
      sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
        fit: "inside",
        withoutEnlargement: false,
      });
    } else if (width || height) {
      // For non-SVG images, use normal resize logic
      sharpInstance = sharpInstance.resize(width, height, {
        withoutEnlargement,
      });
    }

    return await sharpInstance.webp({ quality }).toBuffer();
  } catch (error) {
    throw new ValidationError(`Failed to process image: ${error.message}`);
  }
}

module.exports = {
  convertToWebP,
  processImageForUpload,
  sanitizeFileName,
  DEFAULT_QUALITY,
};
