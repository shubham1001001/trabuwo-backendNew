const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const {
  authenticate,
  requireRole,
  attachUserIfPresent,
} = require("../../middleware/auth");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * @swagger
 * /api/catalogue:
 *   get:
 *     summary: Get all catalogues with simple cursor pagination
 *     description: Retrieve catalogues with simple publicId-based cursor pagination for infinite scroll
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: personalize
 *         schema:
 *           type: boolean
 *           default: false
 *         description: "Opt-in personalization. When true and a valid Bearer token is present, the API auto-applies recent viewed category IDs. Ignored if categoryId is provided or no valid token/history."
 *         example: true
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (base64 encoded publicId)
 *         example: "MDE3ZjQ4YzYtMDAwMC03MDAwLTAwMDAtMDAwMDAwMDAwMDAw"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of catalogues per page
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         description: Search term to filter catalogues by product content
 *         example: "summer collection"
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter catalogues by category ID. If the category is not a leaf category, all leaf descendant categories will be included automatically.
 *         example: 5
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter (from ProductVariant.trabuwoPrice)
 *         example: 100
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter (from ProductVariant.trabuwoPrice)
 *         example: 500
 *       - in: query
 *         name: color
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: "Filter by product color (use multiple parameters for multiple values)"
 *         example: ["red", "blue"]
 *       - in: query
 *         name: size
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: "Filter by product variant size (use multiple parameters for multiple values)"
 *         example: ["M", "L"]
 *       - in: query
 *         name: fabric
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: "Filter by product fabric (use multiple parameters for multiple values)"
 *         example: ["cotton"]
 *       - in: query
 *         name: rating
 *         schema:
 *           oneOf:
 *             - type: number
 *               minimum: 0
 *               maximum: 5
 *             - type: array
 *               items:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *         description: "Filter catalogues by minimum average rating from reviews. Can be a single value or multiple values (uses minimum). Example: rating=4 or rating=3&rating=4"
 *         example: 4
 *       - in: query
 *         name: discount
 *         schema:
 *           oneOf:
 *             - type: number
 *               minimum: 10
 *               maximum: 90
 *             - type: array
 *               items:
 *                 type: number
 *                 minimum: 10
 *                 maximum: 90
 *         description: "Filter catalogues by minimum discount percent from active promotions. Can be a single value or multiple values (uses minimum). Example: discount=20 or discount=20&discount=30"
 *         example: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [priceHighToLow, priceLowToHigh, rating, promotion]
 *         description: "Sort catalogues. 'priceHighToLow'/'priceLowToHigh' uses the highest Trabuwo price in each catalogue. 'rating' sorts by average rating from reviews (highest to lowest). 'promotion' sorts by highest discount percent from active promotions (highest to lowest)."
 *     responses:
 *       200:
 *         description: Catalogues retrieved successfully with cursor pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     catalogues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                             example: "017f48c6-0000-7000-0000-000000000000"
 *                           name:
 *                             type: string
 *                             example: "Summer Collection 2024"
 *                           description:
 *                             type: string
 *                             example: "Latest summer fashion collection"
 *                           status:
 *                             type: string
 *                             enum: [draft, qc_in_progress, qc_passed, qc_error, live, paused]
 *                             example: "live"
 *                           userId:
 *                             type: integer
 *                             example: 1
 *                           categoryId:
 *                             type: integer
 *                             example: 1
 *                           averageRating:
 *                             type: number
 *                             format: decimal
 *                             minimum: 0.00
 *                             maximum: 5.00
 *                             example: 4.25
 *                           reviewsCount:
 *                             type: integer
 *                             minimum: 0
 *                             example: 42
 *                           thumbnailUrl:
 *                             type: string
 *                             format: uri
 *                             example: "https://example.com/images/catalogue-thumbnail.jpg"
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               name:
 *                                 type: string
 *                                 example: "Fashion"
 *                               slug:
 *                                 type: string
 *                                 example: "fashion"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         nextCursor:
 *                           type: string
 *                           example: "MDE3ZjQ4YzYtMDAwMC03MDAwLTAwMDAtMDAwMDAwMDAwMDAw"
 *                         limit:
 *                           type: integer
 *                           example: 20
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Limit must be between 1 and 100"]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

router.get(
  "/",
  attachUserIfPresent,
  validation.getAllCataloguesKeysetValidation,
  asyncHandler(controller.getAllCataloguesWithKeysetPagination),
);

/**
 * @swagger
 * /api/catalogue/search:
 *   get:
 *     summary: Search live catalogues for search bar suggestions
 *     description: Return a minimal list of up to 10 live catalogues matching the search query, optimized for search bar results.
 *     tags: [Catalogue]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         description: Search term to match against catalogue products
 *         example: "summer saree"
 *     responses:
 *       200:
 *         description: Minimal catalogue search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     catalogues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                             example: "017f48c6-0000-7000-000000000000"
 *                           name:
 *                             type: string
 *                             example: "Summer Collection 2024"
 *                           category:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 3
 *                               name:
 *                                 type: string
 *                                 example: "Saree"
 *                               slug:
 *                                 type: string
 *                                 example: "saree"
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             example: "https://cdn.example.com/images/saree.webp"
 *       400:
 *         description: Bad request - Invalid parameters
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/search",
  attachUserIfPresent,
  validation.searchMinimalCataloguesValidation,
  asyncHandler(controller.searchMinimalCatalogues),
);

/**
 * @swagger
 * /api/catalogue/seller/{sellerPublicId}:
 *   get:
 *     summary: Get all catalogues by seller publicId with products and pagination
 *     description: Retrieve catalogues for a specific seller by their publicId. Authentication is optional - if provided, wishlist information will be included.
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerPublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Seller's public ID (UUID)
 *         example: "0199844c-2265-72af-a2b8-d6da7fb72e37"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ${JSON.stringify(VALID_STATUSES)}
 *         description: Filter by catalogue status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         description: Search term to filter by product content within seller's catalogues
 *         example: "summer"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Catalogues retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 catalogues:
 *                   - publicId: "0199844c-2265-72af-a2b8-d6da7fb72e37"
 *                     name: "Premium Silk Collection"
 *                     description: null
 *                     status: "qc_in_progress"
 *                     userId: "1"
 *                     categoryId: 3
 *                     averageRating: "0.00"
 *                     reviewsCount: 0
 *                     thumbnailUrl: null
 *                     minPrice: "0.00"
 *                     maxPrice: "0.00"
 *                     maxTrabuwoPrice: "12999.99"
 *                     createdAt: "2025-09-26T04:33:26.118Z"
 *                     updatedAt: "2025-09-26T04:33:26.118Z"
 *                     category:
 *                       name: "Saree"
 *                       slug: "saree"
 *                     influencerPromotions:
 *                       - commission: 10
 *                         status: "ACTIVE"
 *                     products:
 *                       - publicId: "0199844c-22f7-75d3-8dc6-1bf598b405b2"
 *                         name: "Banarasi Silk Saree"
 *                         variants:
 *                           - trabuwoPrice: "8999.99"
 *                             mrp: "12999.99"
 *                         promotions: []
 *                         images:
 *                           - imageUrl: "d7548un9mg0.cloudfront.net/banners/1/small.webp"
 *                             sortOrder: 1
 *                             isPrimary: true
 *                         wishlistItems: []
 *                     isWishlisted: false
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 25
 *                   totalPages: 3
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Seller not found"
 *               error: NOT_FOUND
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/seller/:sellerPublicId",
  attachUserIfPresent,
  validation.getCataloguesBySellerPublicIdValidation,
  asyncHandler(controller.getCataloguesBySellerPublicId),
);

// Apply authentication to all routes
router.use(authenticate);
/**
 * @swagger
 * /api/catalogue/seller:
 *   get:
 *     summary: Get all catalogues by seller with products and pagination
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ${JSON.stringify(VALID_STATUSES)}
 *         description: Filter by catalogue status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         description: Search term to filter by product content within seller's catalogues
 *         example: "summer"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Catalogues retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 catalogues:
 *                   - id: 1
 *                     fileId: "CAT-ABC123-DEF456"
 *                     name: "Summer Collection 2024"
 *                     description: "Latest summer fashion collection"
 *                     status: "draft"
 *                     userId: 1
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     products:
 *                       - id: "123e4567-e89b-12d3-a456-426614174000"
 *                         name: "Summer Dress"
 *                         description: "Beautiful summer dress"
 *                         price: "99.99"
 *                         stock: 50
 *                         category:
 *                           id: 1
 *                           name: "Dresses"
 *                         images:
 *                           - id: "456e7890-e89b-12d3-a456-426614174000"
 *                             imageUrl: "https://example.com/dress.jpg"
 *                             altText: "Summer Dress"
 *                             isPrimary: true
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 25
 *                   totalPages: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/seller",
  validation.getCatalogueListValidation,
  asyncHandler(controller.getCatalogueList),
);
/**
 * @swagger
 * /api/catalogue/create:
 *   post:
 *     summary: Create a new catalogue
 *     tags: [Catalogue]
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Name of the catalogue
 *                 example: "Summer Collection 2024"
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Description of the catalogue
 *                 example: "Latest summer fashion collection"
 *     responses:
 *       201:
 *         description: Catalogue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Catalogue created"
 *               data:
 *                 id: 1
 *                 fileId: "CAT-ABC123-DEF456"
 *                 name: "Summer Collection 2024"
 *                 description: "Latest summer fashion collection"
 *                 status: "draft"
 *                 userId: 1
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/create",
  validation.createCatalogueValidation,
  asyncHandler(controller.createCatalogue),
);

/**
 * @swagger
 * /api/catalogue/bulk-template/{categoryId}:
 *   get:
 *     summary: Download bulk upload Excel template for a category
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/bulk-template/:categoryId",
  asyncHandler(controller.getBulkTemplate)
);

/**
 * @swagger
 * /api/catalogue/bulk-upload:
 *   post:
 *     summary: Bulk upload catalogues via Excel and Zip
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/bulk-upload",
  upload.fields([
    { name: "excel", maxCount: 1 },
    { name: "zip", maxCount: 1 }
  ]),
  asyncHandler(controller.bulkUpload)
);

/**
 * @swagger
 * /api/catalogue/{id}:
 *   get:
 *     summary: Get catalogue details by ID
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalogue ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Catalogue details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 fileId: "CAT-ABC123-DEF456"
 *                 name: "Summer Collection 2024"
 *                 description: "Latest summer fashion collection"
 *                 status: "draft"
 *                 userId: 1
 *                 user: {
 *                   id: 1,
 *                   name: "John Doe",
 *                   email: "john@example.com"
 *                 }
 *                 sellerStats:
 *                   averageRating: 4.5
 *                   ratingCount: 120
 *                   cataloguesCount: 15
 *                   followersCount: 250
 *                   storeName: "John Doe's Store"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/catalogue/qc-error-count:
 *   get:
 *     summary: Get count and IDs of catalogues with QC error status (Admin only)
 *     description: Returns the total count and array of catalogue IDs that have qc_error status
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QC error count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           description: Total number of catalogues with qc_error status
 *                           example: 5
 *                         catalogueIds:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           description: Array of catalogue IDs with qc_error status
 *                           example: [1, 3, 7, 12, 15]
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 count: 5
 *                 catalogueIds: [1, 3, 7, 12, 15]
 *               message: "QC error count retrieved successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get QC error count and catalogue IDs
router.get("/qc-error-count", asyncHandler(controller.getQcErrorCount));

/**
 * @swagger
 * /api/catalogue/status-counts:
 *   get:
 *     summary: Get comprehensive catalogue status counts (Admin only)
 *     description: Returns total count and breakdown of catalogues by their status (draft, qc_in_progress, qc_passed, qc_error)
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catalogue status counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of catalogues
 *                           example: 25
 *                         byStatus:
 *                           type: object
 *                           properties:
 *                             draft:
 *                               type: integer
 *                               description: Number of catalogues with draft status
 *                               example: 10
 *                             qc_in_progress:
 *                               type: integer
 *                               description: Number of catalogues with qc_in_progress status
 *                               example: 8
 *                             qc_passed:
 *                               type: integer
 *                               description: Number of catalogues with qc_passed status
 *                               example: 4
 *                             qc_error:
 *                               type: integer
 *                               description: Number of catalogues with qc_error status
 *                               example: 3
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 total: 25
 *                 byStatus:
 *                   draft: 10
 *                   qc_in_progress: 8
 *                   qc_passed: 4
 *                   qc_error: 3
 *               message: "Catalogue status counts retrieved successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get comprehensive catalogue status counts
router.get("/status-counts", asyncHandler(controller.getCatalogueStatusCounts));

router.get(
  "/:id",
  validation.getCatalogueByIdValidation,
  asyncHandler(controller.getCatalogueById),
);

/**
 * @swagger
 * /api/catalogue/{id}/update:
 *   put:
 *     summary: Update catalogue (for drafts only)
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalogue ID
 *         example: 1
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
 *                 description: Name of the catalogue
 *                 example: "Updated Summer Collection 2024"
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Description of the catalogue
 *                 example: "Updated summer fashion collection"
 *     responses:
 *       200:
 *         description: Catalogue updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Catalogue updated"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/:id/update",
  validation.updateCatalogueValidation,
  asyncHandler(controller.updateCatalogue),
);

/**
 * @swagger
 * /api/catalogue/{id}:
 *   delete:
 *     summary: Discard catalogue (if not submitted)
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalogue ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Catalogue deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Catalogue deleted"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/:id",
  validation.deleteCatalogueValidation,
  asyncHandler(controller.deleteCatalogue),
);

/**
 * @swagger
 * /api/catalogue/{id}/submit:
 *   post:
 *     summary: Submit catalogue for QC review
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalogue ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Catalogue submitted for QC successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Catalogue submitted for QC"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/:id/submit",
  validation.submitCatalogueValidation,
  asyncHandler(controller.submitCatalogueForQC),
);

// Admin routes for QC management
/**
 * @swagger
 * /api/catalogue/{id}/qc-status:
 *   patch:
 *     summary: Update QC status (Admin only)
 *     tags:
 *       - Catalogue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Catalogue public ID (UUID)
 *         example: "017f48c6-0000-7000-0000-000000000000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: QC status
 *                 example: qc_passed
 *               qcNotes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: QC review notes
 *                 example: All products meet quality standards
 *     responses:
 *       200:
 *         description: QC status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: QC status updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch(
  "/:id/qc-status",
  requireRole("admin"),
  validation.updateQCStatusValidation,
  asyncHandler(controller.updateQCStatus),
);

/**
 * @swagger
 * /api/catalogue/status/{status}:
 *   get:
 *     summary: Get catalogues by status with pagination, date range, and category filters (Admin only)
 *     tags: [Catalogue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: ${JSON.stringify(VALID_STATUSES)}
 *         description: Catalogue status to filter by
 *         example: "qc_in_progress"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering catalogues by creation date (ISO 8601 format)
 *         example: "2024-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering catalogues by creation date (ISO 8601 format)
 *         example: "2024-12-31T23:59:59.999Z"
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter catalogues by category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Catalogues retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 catalogues:
 *                   - id: 1
 *                     publicId: "017f48c6-0000-7000-0000-000000000000"
 *                     name: "Summer Collection 2024"
 *                     description: "Latest summer fashion collection"
 *                     status: "qc_in_progress"
 *                     userId: 1
 *                     categoryId: 1
 *                     averageRating: 4.25
 *                     reviewsCount: 42
 *                     thumbnailUrl: "https://example.com/images/catalogue-thumbnail.jpg"
 *                     category:
 *                       id: 1
 *                       name: "Fashion"
 *                       slug: "fashion"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 25
 *                   totalPages: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/status/:status",
  validation.getCataloguesByStatusValidation,
  asyncHandler(controller.getCataloguesByStatus),
);

module.exports = router;
