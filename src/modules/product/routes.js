const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, attachUserIfPresent } = require("../../middleware/auth");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for single image
});

/**
 * @swagger
 * /api/product/catalogue/{catalogueId}:
 *   get:
 *     summary: Get products by catalogue ID
 *     description: Retrieves all products for a specific catalogue
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: catalogueId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Catalogue public ID
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       400:
 *         description: Invalid catalogue ID format
 *       404:
 *         description: Catalogue not found
 */
router.get(
  "/catalogue/:catalogueId",
  attachUserIfPresent,
  validation.getProductsByCatalogueValidation,
  asyncHandler(controller.getProductsByCatalogueId)
);

router.use(authenticate);

/**
 * @swagger
 * /api/product/single-catalogue:
 *   post:
 *     summary: Create a single catalogue with products
 *     description: Creates a new catalogue with 1-9 products. All product fields are validated according to the constraints.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - products
 *             properties:
 *               name:
 *                 type: string
 *                 description: Catalogue name
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: "Summer Collection 2024"
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category UUID
 *                 example: "01234567-89ab-cdef-0123-456789abcdef"
 *               products:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 9
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - manufacturerName
 *                     - manufacturerPincode
 *                     - manufacturerAddress
 *                     - countryOfOrigin
 *                     - packerName
 *                     - packerAddress
 *                     - packerPincode
 *                     - importerName
 *                     - importerAddress
 *                     - importerPincode
 *                     - weightInGram
 *                     - dynamicFields
 *                     - images
 *                     - variants
 *                   properties:
 *                     name:
 *                       type: string
 *                       minLength: 1
 *                       maxLength: 255
 *                       description: Product name (must be trimmed)
 *                     styleCode:
 *                       type: string
 *                       maxLength: 255
 *                       description: Style code (optional, must be trimmed)
 *                     manufacturerName:
 *                       type: string
 *                       minLength: 3
 *                       maxLength: 255
 *                       description: Manufacturer name (must be trimmed)
 *                     manufacturerPincode:
 *                       type: string
 *                       pattern: '^[0-9]{6}$'
 *                       minLength: 6
 *                       maxLength: 6
 *                       description: Manufacturer pincode (exactly 6 digits, numeric only)
 *                     manufacturerAddress:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 500
 *                       description: Manufacturer address (must be trimmed)
 *                     countryOfOrigin:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 100
 *                       description: Country of origin (must be trimmed)
 *                     packerName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 255
 *                       description: Packer name (must be trimmed)
 *                     packerAddress:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 500
 *                       description: Packer address (must be trimmed)
 *                     packerPincode:
 *                       type: string
 *                       pattern: '^[0-9]{6}$'
 *                       minLength: 6
 *                       maxLength: 6
 *                       description: Packer pincode (exactly 6 digits, numeric only)
 *                     importerName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 255
 *                       description: Importer name (must be trimmed)
 *                     importerAddress:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 500
 *                       description: Importer address (must be trimmed)
 *                     importerPincode:
 *                       type: string
 *                       pattern: '^[0-9]{6}$'
 *                       minLength: 6
 *                       maxLength: 6
 *                       description: Importer pincode (exactly 6 digits, numeric only)
 *                     description:
 *                       type: string
 *                       maxLength: 1000
 *                       description: Product description (optional, must be trimmed)
 *                     weightInGram:
 *                       type: integer
 *                       minimum: 1
 *                       description: Weight in grams (positive integer, minimum 1)
 *                     dynamicFields:
 *                       type: object
 *                       description: Dynamic fields based on category schema (must be an object, not array)
 *                     images:
 *                       type: array
 *                       minItems: 1
 *                       items:
 *                         type: object
 *                         required:
 *                           - imageKey
 *                         properties:
 *                           imageKey:
 *                             type: string
 *                             description: S3 image key
 *                           altText:
 *                             type: string
 *                             description: Alt text (optional)
 *                           caption:
 *                             type: string
 *                             description: Caption (optional)
 *                           sortOrder:
 *                             type: integer
 *                             minimum: 0
 *                             description: Sort order (optional, default 0)
 *                           isPrimary:
 *                             type: boolean
 *                             description: Is primary image (optional, default false)
 *                     variants:
 *                       type: array
 *                       minItems: 1
 *                       items:
 *                         type: object
 *                         required:
 *                           - trabuwoPrice
 *                           - dynamicFields
 *                         properties:
 *                           trabuwoPrice:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0
 *                             multipleOf: 0.01
 *                             description: Trabuwo price (max 2 decimal places)
 *                           wrongDefectiveReturnPrice:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0
 *                             multipleOf: 0.01
 *                             description: Wrong defective return price (optional, max 2 decimal places)
 *                           mrp:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0
 *                             multipleOf: 0.01
 *                             description: MRP (optional, max 2 decimal places)
 *                           inventory:
 *                             type: integer
 *                             minimum: 0
 *                             description: Inventory count (optional, non-negative integer)
 *                           skuId:
 *                             type: string
 *                             maxLength: 100
 *                             description: SKU ID (optional, must be trimmed)
 *                           dynamicFields:
 *                             type: object
 *                             description: Variant dynamic fields (must be an object, not array)
 *     responses:
 *       201:
 *         description: Catalogue and products created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/single-catalogue",
  validation.validateSingleCatalogue,
  asyncHandler(controller.createSingleCatalogueWithProducts)
);

/**
 * @swagger
 * /api/product/bulk-catalogue:
 *   post:
 *     summary: Create multiple catalogues with products
 *     description: Creates multiple catalogues, each with 1-9 products. All product fields are validated according to the constraints.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - catalogues
 *             properties:
 *               catalogues:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - categoryId
 *                     - products
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Catalogue name
 *                       minLength: 1
 *                       maxLength: 255
 *                     categoryId:
 *                       type: string
 *                       format: uuid
 *                       description: Category UUID
 *                     products:
 *                       type: array
 *                       minItems: 1
 *                       maxItems: 9
 *                       items:
 *                         type: object
 *                         required:
 *                           - name
 *                           - manufacturerName
 *                           - manufacturerPincode
 *                           - manufacturerAddress
 *                           - countryOfOrigin
 *                           - packerName
 *                           - packerAddress
 *                           - packerPincode
 *                           - importerName
 *                           - importerAddress
 *                           - importerPincode
 *                           - weightInGram
 *                           - dynamicFields
 *                           - images
 *                           - variants
 *                         properties:
 *                           name:
 *                             type: string
 *                             minLength: 1
 *                             maxLength: 255
 *                           styleCode:
 *                             type: string
 *                             maxLength: 255
 *                           manufacturerName:
 *                             type: string
 *                             minLength: 3
 *                             maxLength: 255
 *                           manufacturerPincode:
 *                             type: string
 *                             pattern: '^[0-9]{6}$'
 *                             minLength: 6
 *                             maxLength: 6
 *                           manufacturerAddress:
 *                             type: string
 *                             minLength: 5
 *                             maxLength: 500
 *                           countryOfOrigin:
 *                             type: string
 *                             minLength: 2
 *                             maxLength: 100
 *                           packerName:
 *                             type: string
 *                             minLength: 2
 *                             maxLength: 255
 *                           packerAddress:
 *                             type: string
 *                             minLength: 5
 *                             maxLength: 500
 *                           packerPincode:
 *                             type: string
 *                             pattern: '^[0-9]{6}$'
 *                             minLength: 6
 *                             maxLength: 6
 *                           importerName:
 *                             type: string
 *                             minLength: 2
 *                             maxLength: 255
 *                           importerAddress:
 *                             type: string
 *                             minLength: 5
 *                             maxLength: 500
 *                           importerPincode:
 *                             type: string
 *                             pattern: '^[0-9]{6}$'
 *                             minLength: 6
 *                             maxLength: 6
 *                           description:
 *                             type: string
 *                             maxLength: 1000
 *                           weightInGram:
 *                             type: integer
 *                             minimum: 1
 *                           dynamicFields:
 *                             type: object
 *                           images:
 *                             type: array
 *                             minItems: 1
 *                             items:
 *                               type: object
 *                               required:
 *                                 - imageKey
 *                               properties:
 *                                 imageKey:
 *                                   type: string
 *                                 altText:
 *                                   type: string
 *                                 caption:
 *                                   type: string
 *                                 sortOrder:
 *                                   type: integer
 *                                   minimum: 0
 *                                 isPrimary:
 *                                   type: boolean
 *                           variants:
 *                             type: array
 *                             minItems: 1
 *                             items:
 *                               type: object
 *                               required:
 *                                 - trabuwoPrice
 *                                 - dynamicFields
 *                               properties:
 *                                 trabuwoPrice:
 *                                   type: number
 *                                   format: decimal
 *                                   minimum: 0
 *                                   multipleOf: 0.01
 *                                 wrongDefectiveReturnPrice:
 *                                   type: number
 *                                   format: decimal
 *                                   minimum: 0
 *                                   multipleOf: 0.01
 *                                 mrp:
 *                                   type: number
 *                                   format: decimal
 *                                   minimum: 0
 *                                   multipleOf: 0.01
 *                                 inventory:
 *                                   type: integer
 *                                   minimum: 0
 *                                 skuId:
 *                                   type: string
 *                                   maxLength: 100
 *                                 dynamicFields:
 *                                   type: object
 *     responses:
 *       201:
 *         description: Catalogues and products created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/bulk-catalogue",
  validation.bulkCatalogueCreateValidation,
  asyncHandler(controller.createBulkCataloguesWithProducts)
);

/**
 * @swagger
 * /api/product/bulk-update:
 *   put:
 *     summary: Bulk update products
 *     description: Update multiple products (1-9) with images and variants. All fields follow the same validation rules as product creation.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - catalogueId
 *               - categoryId
 *               - products
 *             properties:
 *               catalogueId:
 *                 type: string
 *                 format: uuid
 *                 description: Catalogue UUID
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category UUID
 *               products:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 9
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - manufacturerName
 *                     - manufacturerPincode
 *                     - manufacturerAddress
 *                     - countryOfOrigin
 *                     - packerName
 *                     - packerAddress
 *                     - packerPincode
 *                     - importerName
 *                     - importerAddress
 *                     - importerPincode
 *                     - dynamicFields
 *                     - images
 *                     - variants
 *                   properties:
 *                     publicId:
 *                       type: string
 *                       format: uuid
 *                       description: Product public ID (for updates)
 *                     name:
 *                       type: string
 *                       minLength: 1
 *                       maxLength: 255
 *                     styleCode:
 *                       type: string
 *                       maxLength: 255
 *                     manufacturerName:
 *                       type: string
 *                       minLength: 3
 *                       maxLength: 255
 *                     manufacturerPincode:
 *                       type: string
 *                       pattern: '^[0-9]{6}$'
 *                       minLength: 6
 *                       maxLength: 6
 *                     manufacturerAddress:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 500
 *                     countryOfOrigin:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 100
 *                     packerName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 255
 *                     packerAddress:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 500
 *                     packerPincode:
 *                       type: string
 *                       pattern: '^[0-9]{6}$'
 *                       minLength: 6
 *                       maxLength: 6
 *                     importerName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 255
 *                     importerAddress:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 500
 *                     importerPincode:
 *                       type: string
 *                       pattern: '^[0-9]{6}$'
 *                       minLength: 6
 *                       maxLength: 6
 *                     description:
 *                       type: string
 *                       maxLength: 1000
 *                     dynamicFields:
 *                       type: object
 *                     images:
 *                       type: array
 *                       minItems: 1
 *                       items:
 *                         type: object
 *                         properties:
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                           imageKey:
 *                             type: string
 *                           altText:
 *                             type: string
 *                           caption:
 *                             type: string
 *                           sortOrder:
 *                             type: integer
 *                             minimum: 0
 *                           isPrimary:
 *                             type: boolean
 *                     variants:
 *                       type: array
 *                       minItems: 1
 *                       items:
 *                         type: object
 *                         properties:
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                           trabuwoPrice:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0
 *                             multipleOf: 0.01
 *                           wrongDefectiveReturnPrice:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0
 *                             multipleOf: 0.01
 *                           mrp:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0
 *                             multipleOf: 0.01
 *                           inventory:
 *                             type: integer
 *                             minimum: 0
 *                           skuId:
 *                             type: string
 *                             maxLength: 100
 *                           dynamicFields:
 *                             type: object
 *     responses:
 *       200:
 *         description: Products updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/bulk-update",
  validation.bulkUpdateProductsValidation,
  asyncHandler(controller.bulkUpdateProductsWithImages)
);

/**
 * @swagger
 * /api/product/presigned-url:
 *   post:
 *     summary: Generate presigned URL for image upload
 *     description: Generates a presigned S3 URL for uploading product images
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - contentType
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Name of the file to upload
 *                 example: "product-image.jpg"
 *               contentType:
 *                 type: string
 *                 pattern: '^image/(jpeg|jpg|png|gif|webp)$'
 *                 description: MIME type of the image (must be jpeg, jpg, png, gif, or webp)
 *                 example: "image/jpeg"
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *       400:
 *         description: Validation error - Invalid file name or content type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/presigned-url",
  validation.generatePresignedUrlValidation,
  asyncHandler(controller.generatePresignedUrl)
);

router.post(
  "/upload-direct",
  upload.single("image"),
  asyncHandler(controller.uploadDirect)
);

/**
 * @swagger
 * /api/product/{productId}/variant:
 *   post:
 *     summary: Create a product variant
 *     description: Creates a new variant for an existing product with pricing, inventory, and dynamic fields
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product public ID to create variant for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trabuwoPrice
 *               - wrongDefectiveReturnPrice
 *               - mrp
 *               - inventory
 *               - dynamicFields
 *             properties:
 *               trabuwoPrice:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 multipleOf: 0.01
 *                 description: Trabuwo selling price (max 2 decimal places)
 *                 example: 299.99
 *               wrongDefectiveReturnPrice:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 multipleOf: 0.01
 *                 description: Price for wrong/defective returns (max 2 decimal places)
 *                 example: 0
 *               mrp:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 multipleOf: 0.01
 *                 description: Maximum Retail Price (max 2 decimal places)
 *                 example: 399.99
 *               inventory:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available inventory quantity (non-negative)
 *                 example: 100
 *               skuId:
 *                 type: string
 *                 maxLength: 100
 *                 description: SKU identifier (optional, max 100 characters)
 *                 example: "SKU-123"
 *               dynamicFields:
 *                 type: object
 *                 description: Dynamic fields specific to variant (must be an object, validated against category schema)
 *                 example:
 *                   color: "Red"
 *                   material: "Cotton"
 *     responses:
 *       201:
 *         description: Product variant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Product variant created successfully"
 *               data:
 *                 publicId: "01234567-89ab-cdef-0123-456789abcdef"
 *                 productId: 123
 *                 trabuwoPrice: 299.99
 *                 wrongDefectiveReturnPrice: 0
 *                 mrp: 399.99
 *                 inventory: 100
 *                 skuId: "SKU-123"
 *                 dynamicFields:
 *                   color: "Red"
 *                   material: "Cotton"
 *                   size: "M"
 *                 isActive: true
 *                 createdAt: "2023-01-01T00:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/:productId/variant",
  validation.createProductVariantValidation,
  asyncHandler(controller.createProductVariant)
);

/**
 * @swagger
 * /api/product/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieves a single product by its public ID
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product public ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       400:
 *         description: Invalid product ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.get(
  "/:id",
  validation.getProductValidation,
  asyncHandler(controller.getProductById)
);

/**
 * @swagger
 * /api/product:
 *   get:
 *     summary: Get all products
 *     description: Retrieves a list of all products (with optional query parameters for filtering/pagination)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  validation.getAllProductsValidation,
  asyncHandler(controller.getAllProducts)
);

/**
 * @swagger
 * /api/product/category/{categoryId}:
 *   get:
 *     summary: Get products by category ID
 *     description: Retrieves all products for a specific category
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category public ID
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       400:
 *         description: Invalid category ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.get(
  "/category/:categoryId",
  validation.getProductsByCategoryValidation,
  asyncHandler(controller.getProductsByCategoryId)
);

/**
 * @swagger
 * /api/product/my-products:
 *   get:
 *     summary: Get my products
 *     description: Retrieves all products created by the authenticated user
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/my-products",
  validation.getMyProductsValidation,
  asyncHandler(controller.getMyProducts)
);

/**
 * @swagger
 * /api/product/{id}:
 *   put:
 *     summary: Update a product
 *     description: Updates an existing product with validation against category schema. All fields are optional (partial update).
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product public ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Product name (must be trimmed)
 *                 example: "Updated Product Name"
 *               styleCode:
 *                 type: string
 *                 maxLength: 255
 *                 description: Style code (optional, must be trimmed)
 *                 example: "STYLE-001"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Product description (must be trimmed)
 *                 example: "Updated product description"
 *               manufacturerName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Manufacturer name (must be trimmed)
 *                 example: "ABC Manufacturing Ltd"
 *               manufacturerPincode:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: Manufacturer pincode (exactly 6 digits, numeric only)
 *                 example: "123456"
 *               manufacturerAddress:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 description: Manufacturer address (must be trimmed)
 *                 example: "123 Industrial Area, City"
 *               countryOfOrigin:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Country of origin (must be trimmed)
 *                 example: "India"
 *               packerName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 description: Packer name (must be trimmed)
 *                 example: "XYZ Packing Co"
 *               packerAddress:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 description: Packer address (must be trimmed)
 *                 example: "456 Packing Zone, City"
 *               packerPincode:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: Packer pincode (exactly 6 digits, numeric only)
 *                 example: "654321"
 *               importerName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 description: Importer name (must be trimmed)
 *                 example: "DEF Importers"
 *               importerAddress:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 description: Importer address (must be trimmed)
 *                 example: "789 Import Street, City"
 *               importerPincode:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: Importer pincode (exactly 6 digits, numeric only)
 *                 example: "789012"
 *               weightInGram:
 *                 type: integer
 *                 minimum: 1
 *                 description: Weight in grams (positive integer, minimum 1)
 *                 example: 500
 *               dynamicFields:
 *                 type: object
 *                 description: Dynamic fields based on category schema (must be an object, not array)
 *                 example: { "color": "Red", "size": "Large" }
 *               images:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: Image public ID (for updates)
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       description: Image URL
 *                       example: "https://example.com/image.jpg"
 *                     imageKey:
 *                       type: string
 *                       description: S3 key or file path
 *                       example: "products/image.jpg"
 *                     altText:
 *                       type: string
 *                       maxLength: 255
 *                       description: Alt text for accessibility (must be trimmed)
 *                       example: "Product front view"
 *                     caption:
 *                       type: string
 *                       maxLength: 255
 *                       description: Image caption (must be trimmed)
 *                       example: "Front view of product"
 *                     sortOrder:
 *                       type: integer
 *                       minimum: 0
 *                       description: Display order (non-negative integer)
 *                       example: 0
 *                     isPrimary:
 *                       type: boolean
 *                       description: Whether this is the primary image
 *                       example: true
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: Variant public ID (for updates)
 *                     trabuwoPrice:
 *                       type: number
 *                       format: decimal
 *                       minimum: 0
 *                       multipleOf: 0.01
 *                       description: Trabuwo price (max 2 decimal places)
 *                       example: 299.99
 *                     wrongDefectiveReturnPrice:
 *                       type: number
 *                       format: decimal
 *                       minimum: 0
 *                       multipleOf: 0.01
 *                       description: Wrong defective return price (max 2 decimal places)
 *                       example: 0
 *                     mrp:
 *                       type: number
 *                       format: decimal
 *                       minimum: 0
 *                       multipleOf: 0.01
 *                       description: Maximum retail price (max 2 decimal places)
 *                       example: 399.99
 *                     inventory:
 *                       type: integer
 *                       minimum: 0
 *                       description: Inventory count (non-negative integer)
 *                       example: 100
 *                     skuId:
 *                       type: string
 *                       maxLength: 100
 *                       description: SKU ID (must be trimmed)
 *                       example: "SKU123456"
 *                     dynamicFields:
 *                       type: object
 *                       description: Variant dynamic fields (must be an object, not array)
 *                       example: { "size": "M", "color": "Blue" }
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     name:
 *                       type: string
 *                       example: "Updated Product Name"
 *                     description:
 *                       type: string
 *                       example: "Updated product description"
 *                     price:
 *                       type: string
 *                       example: "99.99"
 *                     stock:
 *                       type: integer
 *                       example: 100
 *                     skuId:
 *                       type: string
 *                       nullable: true
 *                       example: "SKU123456"
 *                     dynamicFields:
 *                       type: object
 *                       example: { "color": "Red", "size": "Large" }
 *                     catalogue:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "Catalogue Name"
 *                     category:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "Category Name"
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           imageUrl:
 *                             type: string
 *                           imageKey:
 *                             type: string
 *                           altText:
 *                             type: string
 *                           caption:
 *                             type: string
 *                           sortOrder:
 *                             type: integer
 *                           isPrimary:
 *                             type: boolean
 *       400:
 *         description: Bad request - Invalid input data or validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Product not found or no permission
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  validation.updateProductValidation,
  asyncHandler(controller.updateProduct)
);

// Delete product
// router.delete(
//   "/:id",
//   validation.deleteProductValidation,
//   asyncHandler(controller.deleteProduct)
// );

/**
 * @swagger
 * /api/products/catalogue/{cataloguePublicId}/bulk:
 *   put:
 *     summary: Bulk update catalogue products
 *     description: Update multiple products in a catalogue with upsert functionality. Creates new products, updates existing ones, and soft deletes products not in the payload.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cataloguePublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Catalogue public ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - products
 *             properties:
 *               products:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 200
 *                 items:
 *                   type: object
 *                   required:
 *                     - publicId
 *                     - name
 *                     - manufacturerName
 *                     - manufacturerPincode
 *                     - manufacturerAddress
 *                     - countryOfOrigin
 *                     - packerName
 *                     - packerAddress
 *                     - packerPincode
 *                     - importerName
 *                     - importerAddress
 *                     - importerPincode
 *                     - weightInGram
 *                     - dynamicFields
 *                   properties:
 *                     publicId:
 *                       type: string
 *                       format: uuid
 *                       description: Product public ID (required for updates)
 *                     name:
 *                       type: string
 *                       minLength: 1
 *                       maxLength: 255
 *                       description: Product name (must be trimmed)
 *                     styleCode:
 *                       type: string
 *                       maxLength: 255
 *                       description: Style code (optional, must be trimmed)
 *                     manufacturerName:
 *                       type: string
 *                       minLength: 3
 *                       maxLength: 255
 *                       description: Manufacturer name (must be trimmed)
 *                     manufacturerPincode:
 *                       type: string
 *                       pattern: '^[0-9]{6}$'
 *                       minLength: 6
 *                       maxLength: 6
 *                       description: Manufacturer pincode (exactly 6 digits, numeric only)
 *                     manufacturerAddress:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 500
 *                       description: Manufacturer address (must be trimmed)
 *                     countryOfOrigin:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 100
 *                       description: Country of origin (must be trimmed)
 *                     packerName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 255
 *                       description: Packer name (must be trimmed)
 *                     packerAddress:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 500
 *                       description: Packer address (must be trimmed)
 *                     packerPincode:
 *                       type: string
 *                       pattern: '^[0-9]{6}$'
 *                       minLength: 6
 *                       maxLength: 6
 *                       description: Packer pincode (exactly 6 digits, numeric only)
 *                     importerName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 255
 *                       description: Importer name (must be trimmed)
 *                     importerAddress:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 500
 *                       description: Importer address (must be trimmed)
 *                     importerPincode:
 *                       type: string
 *                       pattern: '^[0-9]{6}$'
 *                       minLength: 6
 *                       maxLength: 6
 *                       description: Importer pincode (exactly 6 digits, numeric only)
 *                     description:
 *                       type: string
 *                       maxLength: 1000
 *                       description: Product description (optional, must be trimmed)
 *                     weightInGram:
 *                       type: integer
 *                       minimum: 1
 *                       description: Weight in grams (positive integer, minimum 1)
 *                     dynamicFields:
 *                       type: object
 *                       description: Dynamic fields based on category schema (must be an object, not array)
 *                     images:
 *                       type: array
 *                       maxItems: 10
 *                       items:
 *                         type: object
 *                         properties:
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                             description: Image public ID (for updates)
 *                           imageKey:
 *                             type: string
 *                             minLength: 1
 *                             maxLength: 500
 *                             description: S3 image key (required, must be trimmed)
 *                           altText:
 *                             type: string
 *                             maxLength: 255
 *                             description: Alt text (must be trimmed)
 *                           caption:
 *                             type: string
 *                             maxLength: 255
 *                             description: Caption (must be trimmed)
 *                           sortOrder:
 *                             type: integer
 *                             minimum: 0
 *                             description: Sort order (non-negative integer)
 *                           isPrimary:
 *                             type: boolean
 *                             description: Is primary image
 *                     variants:
 *                       type: array
 *                       maxItems: 50
 *                       items:
 *                         type: object
 *                         required:
 *                           - trabuwoPrice
 *                         properties:
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                             description: Variant public ID (for updates)
 *                           trabuwoPrice:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0
 *                             multipleOf: 0.01
 *                             description: Trabuwo price (max 2 decimal places)
 *                           wrongDefectiveReturnPrice:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0
 *                             multipleOf: 0.01
 *                             description: Wrong defective return price (max 2 decimal places)
 *                           mrp:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0
 *                             multipleOf: 0.01
 *                             description: MRP (max 2 decimal places)
 *                           inventory:
 *                             type: integer
 *                             minimum: 0
 *                             description: Inventory count (non-negative integer)
 *                           skuId:
 *                             type: string
 *                             maxLength: 100
 *                             description: SKU ID (must be trimmed)
 *                           dynamicFields:
 *                             type: object
 *                             description: Variant dynamic fields (must be an object, not array)
 *     responses:
 *       200:
 *         description: Products updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Catalogue products updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: integer
 *                       description: Number of products created
 *                     updated:
 *                       type: integer
 *                       description: Number of products updated
 *                     deleted:
 *                       type: integer
 *                       description: Number of products deleted
 *                     totalProcessed:
 *                       type: integer
 *                       description: Total products processed
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalProcessed:
 *                           type: integer
 *                         created:
 *                           type: integer
 *                         updated:
 *                           type: integer
 *                         deleted:
 *                           type: integer
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Forbidden - User doesn't own the catalogue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       404:
 *         description: Catalogue not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */
router.put(
  "/catalogue/:cataloguePublicId/bulk",
  authenticate,
  validation.validateBulkUpdateCatalogueProducts,
  asyncHandler(controller.bulkUpdateCatalogueProducts)
);

module.exports = router;
