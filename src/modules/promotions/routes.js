const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, requireRole } = require("../../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     Promotion:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique promotion identifier
 *         name:
 *           type: string
 *           description: Promotion name
 *         type:
 *           type: string
 *           enum: [FESTIVAL_SALE, SEASONAL_DISCOUNT, FLASH_SALE, CLEARANCE]
 *           description: Type of promotion
 *         description:
 *           type: string
 *           description: Promotion description
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Promotion start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Promotion end date
 *         status:
 *           type: string
 *           enum: [DRAFT, ACTIVE, PAUSED, EXPIRED]
 *           description: Current promotion status
 *         discountType:
 *           type: string
 *           enum: [PERCENTAGE, FIXED_AMOUNT]
 *           description: Type of discount
 *         discountValue:
 *           type: number
 *           format: decimal
 *           description: Discount value
 *         minOrderValue:
 *           type: number
 *           format: decimal
 *           description: Minimum order value for promotion
 *         maxDiscount:
 *           type: number
 *           format: decimal
 *           description: Maximum discount amount
 *         isActive:
 *           type: boolean
 *           description: Whether promotion is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     PromotionProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique promotion product identifier
 *         promotionId:
 *           type: integer
 *           description: Associated promotion ID
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Associated product ID
 *         sellerId:
 *           type: integer
 *           description: Associated seller ID
 *         discountPercent:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Discount percentage (0-100)
 *         returnDefectiveDiscountPercent:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Return/defective discount percentage (0-100)
 *         isActive:
 *           type: boolean
 *           description: Whether product is active in promotion
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     AddProductRequest:
 *       type: object
 *       required:
 *         - productId
 *         - sellerId
 *         - discountPercent
 *         - returnDefectiveDiscountPercent
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Product ID to add to promotion
 *         sellerId:
 *           type: integer
 *           minimum: 1
 *           description: Seller ID
 *         discountPercent:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Discount percentage
 *         returnDefectiveDiscountPercent:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Return/defective discount percentage
 *
 *     AddMultipleProductsRequest:
 *       type: object
 *       required:
 *         - products
 *       properties:
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/AddProductRequest'
 *           description: Array of products to add
 *
 *     UpdateProductDiscountsRequest:
 *       type: object
 *       required:
 *         - products
 *       properties:
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - productId
 *               - sellerId
 *               - discountPercent
 *               - returnDefectiveDiscountPercent
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: Product ID to update
 *               sellerId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Seller ID
 *               discountPercent:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: New discount percentage
 *               returnDefectiveDiscountPercent:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: New return/defective discount percentage
 *
 *     RemoveMultipleProductsRequest:
 *       type: object
 *       required:
 *         - productIds
 *       properties:
 *         productIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of product IDs to remove
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           description: Response data
 *         error:
 *           type: string
 *           description: Error message if any
 *
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           description: Array of items
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of items
 *             page:
 *               type: integer
 *               description: Current page number
 *             limit:
 *               type: integer
 *               description: Items per page
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication
 *
 *   parameters:
 *     promotionId:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *       description: Promotion ID
 *       example: 1
 *
 *     productId:
 *       name: productId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: Product ID
 *       example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *     sellerId:
 *       name: sellerId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *       description: Seller ID
 *       example: 123
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Access token is missing or invalid"
 *
 *     ForbiddenError:
 *       description: Insufficient permissions
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Insufficient permissions"
 *
 *     ValidationError:
 *       description: Validation error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Validation failed"
 *               details:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Discount percent must be between 0 and 100"]
 *
 *     NotFoundError:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Promotion not found"
 */

router.use(authenticate);

/**
 * @swagger
 * /api/promotions:
 *   get:
 *     summary: Get all promotions with optional filters
 *     description: Retrieve a list of all promotions with optional filtering by status, type, and active state
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, PAUSED, EXPIRED]
 *         description: Filter by promotion status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SALE_EVENTS, DAILY_DEALS, FLASH_EVENTS, WISHCART_AND_CART_OFFERS]
 *         description: Filter by promotion type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active state
 *     responses:
 *       200:
 *         description: List of promotions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Promotion'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/",
  validation.getAllPromotionsValidation,
  asyncHandler(controller.getAllPromotions)
);

/**
 * @swagger
 * /api/promotions/active:
 *   get:
 *     summary: Get active promotions
 *     description: Retrieve all currently active promotions
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active promotions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Promotion'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/active", asyncHandler(controller.getActivePromotions));

/**
 * @swagger
 * /api/promotions/products-not-in-promotions:
 *   get:
 *     summary: Get products not in promotions
 *     description: Retrieve products that are currently not included in any promotion
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: Products not in promotions retrieved successfully
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
 *                   example: "Products not in promotions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/:promotionId/products-not-in-promotions",
  validation.getProductsNotInPromotionsValidation,
  asyncHandler(controller.getProductsNotInPromotions)
);

/**
 * @swagger
 * /api/promotions/{id}:
 *   get:
 *     summary: Get promotion by ID
 *     description: Retrieve a specific promotion by its ID
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     responses:
 *       200:
 *         description: Promotion retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Promotion'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:id",
  validation.getPromotionValidation,
  asyncHandler(controller.getPromotionById)
);

/**
 * @swagger
 * /api/promotions/{id}/sellers:
 *   get:
 *     summary: Get promotion sellers
 *     description: Retrieve all sellers registered for a specific promotion
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     responses:
 *       200:
 *         description: Promotion sellers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:id/sellers",
  validation.getPromotionSellersValidation,
  asyncHandler(controller.getPromotionSellers)
);

/**
 * @swagger
 * /api/promotions/{id}/products:
 *   get:
 *     summary: Get promotion products
 *     description: Retrieve all products associated with a specific promotion
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     responses:
 *       200:
 *         description: Promotion products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PromotionProduct'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:id/products",
  validation.getPromotionProductsValidation,
  asyncHandler(controller.getPromotionProducts)
);

/**
 * @swagger
 * /api/promotions:
 *   post:
 *     summary: Create a new promotion
 *     description: Create a new promotion (Admin only)
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - startDate
 *               - endDate
 *               - discountType
 *               - discountValue
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Promotion name
 *               type:
 *                 type: string
 *                 enum: [FESTIVAL_SALE, SEASONAL_DISCOUNT, FLASH_SALE, CLEARANCE]
 *                 description: Type of promotion
 *               description:
 *                 type: string
 *                 description: Promotion description
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Promotion start date (must be in future)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Promotion end date (must be after start date)
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *                 description: Type of discount
 *               discountValue:
 *                 type: number
 *                 description: Discount value (0-100 for percentage, >0 for fixed amount)
 *               minOrderValue:
 *                 type: number
 *                 minimum: 0
 *                 description: Minimum order value for promotion
 *               maxDiscount:
 *                 type: number
 *                 minimum: 0
 *                 description: Maximum discount amount
 *     responses:
 *       201:
 *         description: Promotion created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Promotion'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  "/",
  requireRole("admin"),
  validation.createPromotionValidation,
  asyncHandler(controller.createPromotion)
);

/**
 * @swagger
 * /api/promotions/{id}:
 *   put:
 *     summary: Update a promotion
 *     description: Update an existing promotion (Admin only)
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Promotion name
 *               type:
 *                 type: string
 *                 enum: [FESTIVAL_SALE, SEASONAL_DISCOUNT, FLASH_SALE, CLEARANCE]
 *                 description: Type of promotion
 *               description:
 *                 type: string
 *                 description: Promotion description
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Promotion start date (must be in future)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Promotion end date (must be after start date)
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, PAUSED, EXPIRED]
 *                 description: Promotion status
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *                 description: Type of discount
 *               discountValue:
 *                 type: number
 *                 description: Discount value (0-100 for percentage, >0 for fixed amount)
 *               minOrderValue:
 *                 type: number
 *                 minimum: 0
 *                 description: Minimum order value for promotion
 *               maxDiscount:
 *                 type: number
 *                 minimum: 0
 *                 description: Maximum discount amount
 *               isActive:
 *                 type: boolean
 *                 description: Whether promotion is active
 *     responses:
 *       200:
 *         description: Promotion updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Promotion'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id",
  requireRole("admin"),
  validation.updatePromotionValidation,
  asyncHandler(controller.updatePromotion)
);

/**
 * @swagger
 * /api/promotions/{id}:
 *   delete:
 *     summary: Delete a promotion
 *     description: Delete a promotion and all associated data (Admin only)
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     responses:
 *       200:
 *         description: Promotion deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(controller.deletePromotion)
);

/**
 * @swagger
 * /api/promotions/{id}/status:
 *   put:
 *     summary: Update promotion status
 *     description: Update the status of a promotion (Admin only)
 *     tags: [Promotions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
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
 *                 enum: [DRAFT, ACTIVE, PAUSED, EXPIRED]
 *                 description: New promotion status
 *     responses:
 *       200:
 *         description: Promotion status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Promotion'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id/status",
  requireRole("admin"),
  validation.updatePromotionStatusValidation,
  asyncHandler(controller.updatePromotionStatus)
);

/**
 * @swagger
 * /api/promotions/{id}/register:
 *   post:
 *     summary: Register seller for promotion
 *     description: Register a seller to participate in a promotion
 *     tags: [Promotion Sellers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *             properties:
 *               sellerId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the seller to register
 *     responses:
 *       201:
 *         description: Seller registered for promotion successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Seller already registered for this promotion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Seller already registered for this promotion"
 */
router.post(
  "/:id/register",
  requireRole("seller"),
  validation.registerSellerValidation,
  asyncHandler(controller.registerSeller)
);

/**
 * @swagger
 * /api/promotions/{id}/sellers/{sellerId}/approve:
 *   put:
 *     summary: Approve seller for promotion
 *     description: Approve a seller's registration for a promotion (Admin only)
 *     tags: [Promotion Sellers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *       - $ref: '#/components/parameters/sellerId'
 *     responses:
 *       200:
 *         description: Seller approved for promotion successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id/sellers/:sellerId/approve",
  requireRole("admin"),
  validation.approveRejectSellerValidation,
  asyncHandler(controller.approveSeller)
);

/**
 * @swagger
 * /api/promotions/{id}/sellers/{sellerId}/reject:
 *   put:
 *     summary: Reject seller for promotion
 *     description: Reject a seller's registration for a promotion (Admin only)
 *     tags: [Promotion Sellers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *       - $ref: '#/components/parameters/sellerId'
 *     responses:
 *       200:
 *         description: Seller rejected for promotion successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id/sellers/:sellerId/reject",
  requireRole("admin"),
  validation.approveRejectSellerValidation,
  asyncHandler(controller.rejectSeller)
);

/**
 * @swagger
 * /api/promotions/{id}/products:
 *   post:
 *     summary: Add a single product to promotion
 *     description: Add a single product to a specific promotion with discount percentages
 *     tags: [Promotion Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddProductRequest'
 *     responses:
 *       201:
 *         description: Product added to promotion successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PromotionProduct'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Product already exists in promotion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Product already added to this promotion"
 */
router.post(
  "/:id/products",
  requireRole("seller"),
  validation.addProductValidation,
  asyncHandler(controller.addProduct)
);

/**
 * @swagger
 * /api/promotions/{id}/products/bulk:
 *   post:
 *     summary: Add multiple products to promotion
 *     description: Add multiple products to a specific promotion with discount percentages in bulk
 *     tags: [Promotion Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMultipleProductsRequest'
 *     responses:
 *       201:
 *         description: Products added to promotion successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PromotionProduct'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: One or more products already exist in promotion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "One or more products already exist in promotion"
 */
router.post(
  "/:id/products/bulk",
  requireRole("seller"),
  validation.addMultipleProductsValidation,
  asyncHandler(controller.addMultipleProducts)
);

/**
 * @swagger
 * /api/promotions/{id}/products/bulk/discounts:
 *   put:
 *     summary: Update multiple product discounts
 *     description: Update discount percentages for multiple products in a promotion
 *     tags: [Promotion Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductDiscountsRequest'
 *     responses:
 *       200:
 *         description: Product discounts updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: boolean
 *                   example: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id/products/bulk/discounts",
  requireRole("seller"),
  validation.updateMultipleProductDiscountsValidation,
  asyncHandler(controller.updateMultipleProductDiscounts)
);

/**
 * @swagger
 * /api/promotions/{id}/products/bulk:
 *   delete:
 *     summary: Remove multiple products from promotion
 *     description: Remove multiple products from a specific promotion
 *     tags: [Promotion Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveMultipleProductsRequest'
 *     responses:
 *       200:
 *         description: Products removed from promotion successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     removedCount:
 *                       type: integer
 *                       description: Number of products removed
 *                       example: 3
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  "/:id/products/bulk",
  requireRole("seller"),
  validation.removeMultipleProductsValidation,
  asyncHandler(controller.removeMultipleProducts)
);

/**
 * @swagger
 * /api/promotions/{id}/products/all:
 *   delete:
 *     summary: Remove all products from promotion
 *     description: Remove all products from a specific promotion for the authenticated seller
 *     tags: [Promotion Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *     responses:
 *       200:
 *         description: All products removed from promotion successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     removedCount:
 *                       type: integer
 *                       description: Number of products removed
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  "/:id/products/all",
  requireRole("seller"),
  validation.removeMultipleProductsValidation,
  asyncHandler(controller.removeAllProducts)
);

/**
 * @swagger
 * /api/promotions/{id}/products/{productId}:
 *   delete:
 *     summary: Remove a single product from promotion
 *     description: Remove a specific product from a promotion
 *     tags: [Promotion Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/promotionId'
 *       - $ref: '#/components/parameters/productId'
 *     responses:
 *       200:
 *         description: Product removed from promotion successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  "/:id/products/:productId",
  requireRole("seller"),
  asyncHandler(controller.removeProduct)
);

module.exports = router;
