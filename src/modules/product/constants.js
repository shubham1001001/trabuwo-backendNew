const BULK_UPDATE_LIMITS = {
  MAX_PRODUCTS_PER_BATCH: 50,
  MAX_IMAGES_PER_PRODUCT: 10,
  BATCH_SIZE_WARNING_THRESHOLD: 25,
};

const VALIDATION_RULES = {
  PRODUCT_NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 1000,
  SKU_ID_MAX_LENGTH: 100,
  ALT_TEXT_MAX_LENGTH: 255,
  CAPTION_MAX_LENGTH: 255,
};

const ERROR_MESSAGES = {
  BATCH_SIZE_TOO_LARGE: `Batch size too large. Maximum ${BULK_UPDATE_LIMITS.MAX_PRODUCTS_PER_BATCH} products allowed`,
  DUPLICATE_PRODUCT_IDS: "Duplicate product IDs are not allowed",
  PRODUCT_NOT_FOUND:
    "Product not found or you don't have permission to access it",
  CATALOGUE_ACCESS_DENIED:
    "You can only update products in your own catalogues",
  CATEGORY_NOT_FOUND: "Category not found",
  DYNAMIC_FIELD_REQUIRED: "Field '{fieldName}' is required",
  DYNAMIC_FIELD_INVALID_TYPE: "Field '{fieldName}' must be a {expectedType}",
  DYNAMIC_FIELD_INVALID_OPTION: "Field '{fieldName}' must be one of: {options}",
  DYNAMIC_FIELD_LENGTH_MIN:
    "Field '{fieldName}' must be at least {minLength} characters",
  DYNAMIC_FIELD_LENGTH_MAX:
    "Field '{fieldName}' must be at most {maxLength} characters",
  DYNAMIC_FIELD_VALUE_MIN: "Field '{fieldName}' must be at least {min}",
  DYNAMIC_FIELD_VALUE_MAX: "Field '{fieldName}' must be at most {max}",
};

module.exports = {
  BULK_UPDATE_LIMITS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
};
