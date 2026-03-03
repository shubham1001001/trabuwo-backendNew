const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const createAssetValidation = [
  body("sectionId")
    .isInt({ min: 1 })
    .withMessage("sectionId must be a positive integer"),
  body("redirectCategoryId")
    .isInt({ min: 1 })
    .withMessage("redirectCategoryId must be a positive integer"),
  body("altText")
    .optional()
    .isLength({ max: 255 })
    .withMessage("altText max 255"),
  body("deviceType")
    .isIn(["mobile", "web", "both"])
    .withMessage("deviceType must be mobile, web or both"),
  body("displayOrder")
    .isInt({ min: 1 })
    .withMessage("displayOrder must be positive integer"),
  body("enabled").optional().isBoolean().withMessage("enabled must be boolean"),
  body("filters")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch {
          throw new Error("filters must be a valid JSON object");
        }
      }
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return true;
      }
      throw new Error("filters must be a valid JSON object");
    })
    .withMessage("filters must be a valid JSON object"),
  handleValidationErrors,
];

const deleteSectionValidation = [
  param("sectionPublicId")
    .isUUID()
    .withMessage("sectionPublicId must be a valid UUID"),
  handleValidationErrors,
];

const deleteAssetValidation = [
  param("publicId").isUUID().withMessage("publicId must be a valid UUID"),
  handleValidationErrors,
];

const updateAssetValidation = [
  body("sectionId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("sectionId must be a positive integer"),
  body("redirectCategoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("redirectCategoryId must be a positive integer"),
  body("altText")
    .optional()
    .isLength({ max: 255 })
    .withMessage("altText max 255"),
  body("deviceType")
    .optional()
    .isIn(["mobile", "web", "both"])
    .withMessage("deviceType must be mobile, web or both"),
  body("displayOrder")
    .optional()
    .isInt({ min: 1 })
    .withMessage("displayOrder must be positive integer"),
  body("enabled").optional().isBoolean().withMessage("enabled must be boolean"),
  body("filters")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch {
          throw new Error("filters must be a valid JSON object");
        }
      }
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return true;
      }
      throw new Error("filters must be a valid JSON object");
    })
    .withMessage("filters must be a valid JSON object"),
  handleValidationErrors,
];

module.exports = {
  createAssetValidation,
  updateAssetValidation,
  deleteSectionValidation,
  deleteAssetValidation,
};
