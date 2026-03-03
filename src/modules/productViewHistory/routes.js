const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, requireRole } = require("../../middleware/auth");

router.use(authenticate);
router.use(requireRole("buyer"));

/**
 * @swagger
 * /api/product-view-history:
 *   post:
 *     summary: Track a product view
 *     description: Record that a user has viewed a product. If the user has already viewed this product, the viewedAt timestamp will be updated.
 *     tags: [Product View History]
 *     operationId: trackProductView
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: "01234567-89ab-7def-0123-456789abcdef"
 *                 description: The public ID of the product viewed
 *     responses:
 *       201:
 *         description: Product view tracked successfully
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
 *                   example: "Product view tracked successfully"
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Bad request
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
 *                   example: "Product ID must be a valid UUID"
 *       404:
 *         description: Product not found
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
 *                   example: "Product not found"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/",
  validation.trackProductViewValidation,
  asyncHandler(controller.trackProductView)
);

/**
 * @swagger
 * /api/product-view-history:
 *   get:
 *     summary: Get user's product view history
 *     description: Retrieve a paginated list of products the user has viewed, sorted by most recently viewed first. Only returns products viewed within the last 7 days.
 *     tags: [Product View History]
 *     operationId: getUserViewHistory
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           maximum: 50
 *           default: 20
 *         description: Number of products per page
 *         example: 20
 *     responses:
 *       200:
 *         description: View history retrieved successfully
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
 *                   example: "View history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                             example: "01234567-89ab-7def-0123-456789abcdef"
 *                           name:
 *                             type: string
 *                             example: "Summer Dress"
 *                           images:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 imageUrl:
 *                                   type: string
 *                                   format: uri
 *                                   example: "https://example.com/images/product.jpg"
 *                                 sortOrder:
 *                                   type: integer
 *                                   example: 0
 *                                 isPrimary:
 *                                   type: boolean
 *                                   example: true
 *                           category:
 *                             type: object
 *                             nullable: true
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
 *                           catalogue:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               publicId:
 *                                 type: string
 *                                 format: uuid
 *                                 example: "01234567-89ab-7def-0123-456789abcdef"
 *                               name:
 *                                 type: string
 *                                 example: "Summer Collection 2024"
 *                               description:
 *                                 type: string
 *                                 example: "Latest summer fashion collection"
 *                               status:
 *                                 type: string
 *                                 enum: [draft, qc_in_progress, qc_passed, qc_error, live, paused, cancelled]
 *                                 example: "live"
 *                               averageRating:
 *                                 type: number
 *                                 format: decimal
 *                                 minimum: 0.00
 *                                 maximum: 5.00
 *                                 example: 4.25
 *                               reviewsCount:
 *                                 type: integer
 *                                 minimum: 0
 *                                 example: 42
 *                               thumbnailUrl:
 *                                 type: string
 *                                 format: uri
 *                                 nullable: true
 *                                 example: "https://example.com/images/catalogue-thumbnail.jpg"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 45
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *       400:
 *         description: Bad request
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
 *                   example: "Page must be a positive integer"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/",
  validation.getUserViewHistoryValidation,
  asyncHandler(controller.getUserViewHistory)
);

module.exports = router;
