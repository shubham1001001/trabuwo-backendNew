const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

exports.validateSingleCatalogue = [
  body("name")
    .notEmpty()
    .withMessage("Catalogue name is required")
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Catalogue name must be between 1 and 255 characters"),
  body("categoryId").isUUID().withMessage("categoryId must be UUID"),
  body("products")
    .isArray({ min: 1, max: 9 })
    .withMessage("products must be an array with 1 to 9 items"),
  body("products.*.name")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Product name must be between 1 and 255 characters"),
  body("products.*.styleCode")
    .optional()
    .isString()
    .withMessage("styleCode must be a string"),
  body("products.*.manufacturerName")
    .isString()
    .isLength({ min: 3, max: 255 })
    .withMessage("manufacturerName must be between 3 and 255 characters"),
  body("products.*.manufacturerPincode")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Manufacturer pincode must be 6 digits"),
  body("products.*.manufacturerAddress")
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage("manufacturerAddress must be between 5 and 500 characters"),
  body("products.*.countryOfOrigin")
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage("countryOfOrigin must be between 2 and 100 characters"),
  body("products.*.packerName")
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage("packerName must be between 2 and 255 characters"),
  body("products.*.packerAddress")
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage("packerAddress must be between 5 and 500 characters"),
  body("products.*.packerPincode")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Packer pincode must be 6 digits"),
  body("products.*.importerName")
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage("importerName must be between 2 and 255 characters"),
  body("products.*.importerAddress")
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage("importerAddress must be between 5 and 500 characters"),
  body("products.*.importerPincode")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Importer pincode must be 6 digits"),
  body("products.*.dynamicFields")
    .isObject()
    .withMessage("Each product must have dynamicFields object"),
  body("products.*.description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  body("products.*.weightInGram")
    .notEmpty()
    .isInt({ min: 1 })
    .withMessage("Weight in gram must be a positive integer (minimum 1)"),
  body("products.*.images")
    .isArray({ min: 1 })
    .withMessage("Each product must have at least one image"),
  body("products.*.images.*.imageKey")
    .isString()
    .withMessage("imageKey must be a string"),
  body("products.*.images.*.altText")
    .optional()
    .isString()
    .withMessage("altText must be a string"),
  body("products.*.images.*.caption")
    .optional()
    .isString()
    .withMessage("caption must be a string"),
  body("products.*.images.*.sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a non-negative integer"),
  body("products.*.images.*.isPrimary")
    .optional()
    .isBoolean()
    .withMessage("isPrimary must be a boolean"),
  body("products.*.variants")
    .isArray({ min: 1 })
    .withMessage("Each product must have at least one variant"),
  body("products.*.variants.*.trabuwoPrice")
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Trabuwo price must be a positive decimal with max 2 decimal places"
    ),
  body("products.*.variants.*.wrongDefectiveReturnPrice")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Wrong defective return price must be a positive decimal with max 2 decimal places"
    ),
  body("products.*.variants.*.mrp")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage("MRP must be a positive decimal with max 2 decimal places"),
  body("products.*.variants.*.inventory")
    .optional()
    .isInt({ min: 0 })
    .withMessage("inventory must be a non-negative integer"),
  body("products.*.variants.*.skuId")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("skuId must not exceed 100 characters"),
  body("products.*.variants.*.dynamicFields")
    .isObject()
    .withMessage("variant dynamicFields must be an object"),
  handleValidationErrors,
];

exports.createProductValidation = [
  body("catalogueId").isInt().withMessage("catalogueId must be an integer"),
  body("name").notEmpty().withMessage("name is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("price must be a positive number"),
  body("images").optional().isArray().withMessage("images must be an array"),
  body("images.*.imageUrl")
    .optional()
    .isURL()
    .withMessage("imageUrl must be a valid URL"),
  body("images.*.imageKey")
    .optional()
    .isString()
    .withMessage("imageKey must be a string"),
  body("images.*.altText")
    .optional()
    .isString()
    .withMessage("altText must be a string"),
  body("images.*.caption")
    .optional()
    .isString()
    .withMessage("caption must be a string"),
  body("images.*.sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a non-negative integer"),
  body("images.*.isPrimary")
    .optional()
    .isBoolean()
    .withMessage("isPrimary must be a boolean"),
  body("dynamicFields")
    .optional()
    .isObject()
    .withMessage("dynamicFields must be an object"),
  handleValidationErrors,
];

exports.createMultipleProductsValidation = [
  body("products")
    .isArray({ min: 1 })
    .withMessage("products must be a non-empty array"),
  body("products.*.catalogueId")
    .isInt()
    .withMessage("catalogueId must be an integer"),
  body("products.*.name").notEmpty().withMessage("name is required"),
  body("products.*.description")
    .optional()
    .isString()
    .withMessage("description must be a string"),
  body("products.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("price must be a positive number"),
  body("products.*.images")
    .optional()
    .isArray()
    .withMessage("images must be an array"),
  body("products.*.images.*.imageUrl")
    .optional()
    .isURL()
    .withMessage("imageUrl must be a valid URL"),
  body("products.*.images.*.imageKey")
    .optional()
    .isString()
    .withMessage("imageKey must be a string"),
  body("products.*.images.*.altText")
    .optional()
    .isString()
    .withMessage("altText must be a string"),
  body("products.*.images.*.caption")
    .optional()
    .isString()
    .withMessage("caption must be a string"),
  body("products.*.images.*.sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a non-negative integer"),
  body("products.*.images.*.isPrimary")
    .optional()
    .isBoolean()
    .withMessage("isPrimary must be a boolean"),
  body("products.*.dynamicFields")
    .optional()
    .isObject()
    .withMessage("dynamicFields must be an object"),
  handleValidationErrors,
];

exports.updateProductValidation = [
  param("id").isUUID().withMessage("Product ID must be a valid UUID"),
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Product name must be between 1 and 255 characters"),

  body("styleCode")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Style code must not exceed 255 characters"),

  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("dynamicFields")
    .optional()
    .isObject()
    .withMessage("Dynamic fields must be an object"),

  //status also not allowed in updateProductValidation
  // blockReasonType is not allowed in updateProductValidation

  body("manufacturerName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Manufacturer name must be between 3 and 255 characters"),

  body("manufacturerPincode")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Manufacturer pincode must be 6 digits"),

  body("manufacturerAddress")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Manufacturer address must be between 5 and 500 characters"),

  body("countryOfOrigin")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Country of origin must be between 2 and 100 characters"),

  body("packerName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Packer name must be between 2 and 255 characters"),

  body("packerAddress")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Packer address must be between 5 and 500 characters"),

  body("packerPincode")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Packer pincode must be 6 digits"),

  body("importerName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Importer name must be between 2 and 255 characters"),

  body("importerAddress")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Importer address must be between 5 and 500 characters"),

  body("importerPincode")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Importer pincode must be 6 digits"),

  body("weightInGram")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Weight in gram must be a positive integer (minimum 1)"),

  body("images")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Images must be an array with at least 1 item"),
  body("images.*.id")
    .optional()
    .isUUID()
    .withMessage("Image ID must be a valid UUID"),
  body("images.*.imageUrl")
    .optional()
    .isURL()
    .withMessage("Image URL must be a valid URL"),
  body("images.*.imageKey")
    .optional()
    .isString()
    .withMessage("Image key must be a string"),
  body("images.*.altText")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Alt text must not exceed 255 characters"),
  body("images.*.caption")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Caption must not exceed 255 characters"),
  body("images.*.sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),
  body("images.*.isPrimary")
    .optional()
    .isBoolean()
    .withMessage("isPrimary must be a boolean"),

  // Variants validation
  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array"),
  body("variants.*.id")
    .optional()
    .isUUID()
    .withMessage("Variant ID must be a valid UUID"),
  body("variants.*.trabuwoPrice")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Trabuwo price must be a positive decimal with max 2 decimal places"
    ),
  body("variants.*.wrongDefectiveReturnPrice")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Wrong defective return price must be a positive decimal with max 2 decimal places"
    ),
  body("variants.*.mrp")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage("MRP must be a positive decimal with max 2 decimal places"),
  body("variants.*.inventory")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Inventory must be a non-negative integer"),
  body("variants.*.skuId")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("SKU ID must not exceed 100 characters"),
  body("variants.*.dynamicFields")
    .optional()
    .isObject()
    .withMessage("Variant dynamic fields must be an object"),

  handleValidationErrors,
];

exports.getProductValidation = [
  param("id").isUUID().withMessage("id must be an UUID"),
  handleValidationErrors,
];

exports.getProductsByCatalogueValidation = [
  param("catalogueId").isUUID().withMessage("catalogueId must be an UUID"),
  handleValidationErrors,
];

exports.deleteProductValidation = [
  param("id").isUUID().withMessage("Product ID must be a valid UUID"),
  handleValidationErrors,
];

exports.copyProductValidation = [
  param("id").isUUID().withMessage("Product ID must be a valid UUID"),
  handleValidationErrors,
];

exports.bulkCatalogueCreateValidation = [
  body("catalogues")
    .isArray({ min: 1 })
    .withMessage("catalogues must be a non-empty array"),
  body("catalogues.*.name")
    .notEmpty()
    .withMessage("Each catalogue must have a name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Each catalogue name must be between 1 and 255 characters"),
  body("catalogues.*.categoryId")
    .isUUID()
    .withMessage("Each catalogue must have a valid categoryId"),
  body("catalogues.*.products")
    .isArray({ min: 1, max: 9 })
    .withMessage("Each catalogue must have 1 to 9 products"),
  body("catalogues.*.products.*.name")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Product name must be between 1 and 255 characters"),
  body("catalogues.*.products.*.styleCode")
    .optional()
    .isString()
    .withMessage("styleCode must be a string"),
  body("catalogues.*.products.*.manufacturerName")
    .isString()
    .isLength({ min: 3, max: 255 })
    .withMessage("manufacturerName must be between 3 and 255 characters"),
  body("catalogues.*.products.*.manufacturerPincode")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Manufacturer pincode must be 6 digits"),
  body("catalogues.*.products.*.manufacturerAddress")
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage("manufacturerAddress must be between 5 and 500 characters"),
  body("catalogues.*.products.*.countryOfOrigin")
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage("countryOfOrigin must be between 2 and 100 characters"),
  body("catalogues.*.products.*.packerName")
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage("packerName must be between 2 and 255 characters"),
  body("catalogues.*.products.*.packerAddress")
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage("packerAddress must be between 5 and 500 characters"),
  body("catalogues.*.products.*.packerPincode")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Packer pincode must be 6 digits"),
  body("catalogues.*.products.*.importerName")
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage("importerName must be between 2 and 255 characters"),
  body("catalogues.*.products.*.importerAddress")
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage("importerAddress must be between 5 and 500 characters"),
  body("catalogues.*.products.*.importerPincode")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Importer pincode must be 6 digits"),
  body("catalogues.*.products.*.dynamicFields")
    .isObject()
    .withMessage("Each product must have dynamicFields object"),
  body("catalogues.*.products.*.description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  body("catalogues.*.products.*.weightInGram")
    .notEmpty()
    .isInt({ min: 1 })
    .withMessage("Weight in gram must be a positive integer (minimum 1)"),
  body("catalogues.*.products.*.images")
    .isArray({ min: 1 })
    .withMessage("Each product must have at least one image"),
  body("catalogues.*.products.*.images.*.imageKey")
    .isString()
    .withMessage("imageKey must be a string"),
  body("catalogues.*.products.*.images.*.altText")
    .optional()
    .isString()
    .withMessage("altText must be a string"),
  body("catalogues.*.products.*.images.*.caption")
    .optional()
    .isString()
    .withMessage("caption must be a string"),
  body("catalogues.*.products.*.images.*.sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a non-negative integer"),
  body("catalogues.*.products.*.images.*.isPrimary")
    .optional()
    .isBoolean()
    .withMessage("isPrimary must be a boolean"),
  // Variants validation
  body("catalogues.*.products.*.variants")
    .isArray({ min: 1 })
    .withMessage("Each product must have at least one variant"),
  body("catalogues.*.products.*.variants.*.trabuwoPrice")
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Trabuwo price must be a positive decimal with max 2 decimal places"
    ),
  body("catalogues.*.products.*.variants.*.wrongDefectiveReturnPrice")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Wrong defective return price must be a positive decimal with max 2 decimal places"
    ),
  body("catalogues.*.products.*.variants.*.mrp")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage("MRP must be a positive decimal with max 2 decimal places"),
  body("catalogues.*.products.*.variants.*.inventory")
    .optional()
    .isInt({ min: 0 })
    .withMessage("inventory must be a non-negative integer"),
  body("catalogues.*.products.*.variants.*.skuId")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("skuId must not exceed 100 characters"),
  body("catalogues.*.products.*.variants.*.dynamicFields")
    .optional()
    .isObject()
    .withMessage("variant dynamicFields must be an object"),
  handleValidationErrors,
];

// Validation for GET routes with query parameters
exports.getAllProductsValidation = [
  param("id").optional(),
  handleValidationErrors,
];

exports.getProductsByCategoryValidation = [
  param("categoryId").isUUID().withMessage("Category ID must be a valid UUID"),
  handleValidationErrors,
];

exports.getMyProductsValidation = [handleValidationErrors];

exports.bulkUpdateProductsValidation = [
  body("catalogueId").isUUID().withMessage("catalogueId must be a valid UUID"),
  body("categoryId").isUUID().withMessage("categoryId must be UUID"),
  body("products")
    .isArray({ min: 1, max: 9 })
    .withMessage("products must be an array with 1 to 9 items"),
  body("products.*.publicId")
    .optional()
    .isUUID()
    .withMessage("Product publicId must be a valid UUID"),
  body("products.*.name")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Product name must be between 1 and 255 characters"),
  body("products.*.styleCode")
    .optional()
    .isString()
    .withMessage("styleCode must be a string"),
  body("products.*.manufacturerName")
    .isString()
    .isLength({ min: 3, max: 255 })
    .withMessage("manufacturerName must be between 3 and 255 characters"),
  body("products.*.manufacturerPincode")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Manufacturer pincode must be 6 digits"),
  body("products.*.manufacturerAddress")
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage("manufacturerAddress must be between 5 and 500 characters"),
  body("products.*.countryOfOrigin")
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage("countryOfOrigin must be between 2 and 100 characters"),
  body("products.*.packerName")
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage("packerName must be between 2 and 255 characters"),
  body("products.*.packerAddress")
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage("packerAddress must be between 5 and 500 characters"),
  body("products.*.packerPincode")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Packer pincode must be 6 digits"),
  body("products.*.importerName")
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage("importerName must be between 2 and 255 characters"),
  body("products.*.importerAddress")
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage("importerAddress must be between 5 and 500 characters"),
  body("products.*.importerPincode")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Importer pincode must be 6 digits"),
  body("products.*.dynamicFields")
    .isObject()
    .withMessage("Each product must have dynamicFields object"),
  body("products.*.description")
    .optional()
    .isString()
    .withMessage("description must be a string"),
  body("products.*.images")
    .isArray({ min: 1 })
    .withMessage("Each product must have at least one image"),
  body("products.*.images.*.publicId")
    .optional()
    .isUUID()
    .withMessage("image publicId must be a valid UUID"),
  body("products.*.images.*.imageKey")
    .isString()
    .withMessage("imageKey must be a string"),
  body("products.*.images.*.altText")
    .optional()
    .isString()
    .withMessage("altText must be a string"),
  body("products.*.images.*.caption")
    .optional()
    .isString()
    .withMessage("caption must be a string"),
  body("products.*.images.*.sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a non-negative integer"),
  body("products.*.images.*.isPrimary")
    .optional()
    .isBoolean()
    .withMessage("isPrimary must be a boolean"),
  body("products.*.variants")
    .isArray({ min: 1 })
    .withMessage("Each product must have at least one variant"),
  body("products.*.variants.*.publicId")
    .optional()
    .isUUID()
    .withMessage("variant publicId must be a valid UUID"),
  body("products.*.variants.*.trabuwoPrice")
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Trabuwo price must be a positive decimal with max 2 decimal places"
    ),
  body("products.*.variants.*.wrongDefectiveReturnPrice")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Wrong defective return price must be a positive decimal with max 2 decimal places"
    ),
  body("products.*.variants.*.mrp")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage("MRP must be a positive decimal with max 2 decimal places"),
  body("products.*.variants.*.inventory")
    .optional()
    .isInt({ min: 0 })
    .withMessage("inventory must be a non-negative integer"),
  body("products.*.variants.*.skuId")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("skuId must not exceed 100 characters"),
  body("products.*.variants.*.dynamicFields")
    .optional()
    .isObject()
    .withMessage("variant dynamicFields must be an object"),
  handleValidationErrors,
];

exports.generatePresignedUrlValidation = [
  body("fileName")
    .notEmpty()
    .withMessage("fileName is required")
    .isString()
    .withMessage("fileName must be a string"),
  body("contentType")
    .notEmpty()
    .withMessage("contentType is required")
    .isString()
    .withMessage("contentType must be a string")
    .matches(/^image\/(jpeg|jpg|png|gif|webp)$/)
    .withMessage("contentType must be a valid image MIME type"),
  handleValidationErrors,
];

exports.createProductVariantValidation = [
  param("productId").isUUID().withMessage("Product ID must be a valid UUID"),
  body("trabuwoPrice")
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Trabuwo price must be a positive decimal with max 2 decimal places"
    ),
  body("wrongDefectiveReturnPrice")
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Wrong defective return price must be a positive decimal with max 2 decimal places"
    ),
  body("mrp")
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage("MRP must be a positive decimal with max 2 decimal places"),
  body("inventory")
    .isInt({ min: 0 })
    .withMessage("inventory must be a non-negative integer"),
  body("skuId")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("SKU ID must not exceed 100 characters"),
  body("dynamicFields")
    .isObject()
    .withMessage("dynamicFields must be an object"),
  handleValidationErrors,
];

exports.validateBulkUpdateCatalogueProducts = [
  param("cataloguePublicId")
    .isUUID()
    .withMessage("Catalogue public ID must be a valid UUID"),

  body("products")
    .isArray({ min: 1, max: 200 })
    .withMessage("Products must be an array with 1-200 items"),

  body("products.*.publicId")
    .isUUID()
    .withMessage("Product public ID must be a valid UUID"),

  body("products.*.name")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Product name must be 1-255 characters"),

  body("products.*.styleCode")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Style code must not exceed 255 characters"),

  body("products.*.manufacturerName")
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Manufacturer name must be 3-255 characters"),

  body("products.*.manufacturerPincode")
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Manufacturer pincode must be 6 digits"),

  body("products.*.manufacturerAddress")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Manufacturer address must be 5-500 characters"),

  body("products.*.countryOfOrigin")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Country of origin must be 2-100 characters"),

  body("products.*.packerName")
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Packer name must be 2-255 characters"),

  body("products.*.packerAddress")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Packer address must be 5-500 characters"),

  body("products.*.packerPincode")
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Packer pincode must be 6 digits"),

  body("products.*.importerName")
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Importer name must be 2-255 characters"),

  body("products.*.importerAddress")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Importer address must be 5-500 characters"),

  body("products.*.importerPincode")
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Importer pincode must be 6 digits"),

  body("products.*.description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("products.*.weightInGram")
    .notEmpty()
    .isInt({ min: 1 })
    .withMessage("Weight in gram must be a positive integer (minimum 1)"),

  body("products.*.dynamicFields")
    .isObject()
    .withMessage("Dynamic fields must be an object"),

  // Images validation
  body("products.*.images")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Images must be an array with max 10 items"),

  body("products.*.images.*.publicId")
    .optional()
    .isUUID()
    .withMessage("Image public ID must be a valid UUID"),

  body("products.*.images.*.imageKey")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Image key must be 1-500 characters"),

  body("products.*.images.*.altText")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Alt text must not exceed 255 characters"),

  body("products.*.images.*.caption")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Caption must not exceed 255 characters"),

  body("products.*.images.*.sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),

  body("products.*.images.*.isPrimary")
    .optional()
    .isBoolean()
    .withMessage("Is primary must be a boolean"),

  // Variants validation
  body("products.*.variants")
    .optional()
    .isArray({ max: 50 })
    .withMessage("Variants must be an array with max 50 items"),

  body("products.*.variants.*.publicId")
    .optional()
    .isUUID()
    .withMessage("Variant public ID must be a valid UUID"),

  body("products.*.variants.*.trabuwoPrice")
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Trabuwo price must be a positive decimal with max 2 decimal places"
    ),

  body("products.*.variants.*.wrongDefectiveReturnPrice")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage(
      "Wrong defective return price must be a positive decimal with max 2 decimal places"
    ),

  body("products.*.variants.*.mrp")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .isFloat({ min: 0 })
    .withMessage("MRP must be a positive decimal with max 2 decimal places"),

  body("products.*.variants.*.inventory")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Inventory must be a non-negative integer"),

  body("products.*.variants.*.skuId")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("SKU ID must not exceed 100 characters"),

  body("products.*.variants.*.dynamicFields")
    .optional()
    .isObject()
    .withMessage("Variant dynamic fields must be an object"),

  handleValidationErrors,
];
