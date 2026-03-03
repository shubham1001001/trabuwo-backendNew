const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/pricing/stats:
 *   get:
 *     summary: Get pricing statistics
 *     description: Get pricing statistics including price updates and orders for last 7 and 30 days for all seller's products
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pricing statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PricingStats'
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 last7Days:
 *                   priceUpdates: 3
 *                   orders: 15
 *                 last30Days:
 *                   priceUpdates: 8
 *                   orders: 45
 *               message: "Pricing statistics retrieved successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - User doesn't own the product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
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

// Get pricing statistics
router.get(
  "/stats",
  authenticate,
  validation.getPricingStatsValidation,
  asyncHandler(controller.getPricingStats)
);

/**
 * @swagger
 * /api/pricing/stats/view-loss:
 *   get:
 *     summary: Get view loss statistics
 *     description: Get statistics about products losing views for the authenticated seller
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: View loss statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         productsLosingViews:
 *                           type: integer
 *                           description: Number of products losing views
 *                         totalProducts:
 *                           type: integer
 *                           description: Total number of products
 *                         percentageLosingViews:
 *                           type: string
 *                           description: Percentage of products losing views
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 productsLosingViews: 5
 *                 totalProducts: 25
 *                 percentageLosingViews: "20.0"
 *               message: "View loss statistics retrieved successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
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

// Get view loss statistics
router.get(
  "/stats/view-loss",
  authenticate,
  validation.getViewLossStatsValidation,
  asyncHandler(controller.getViewLossStats)
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique product identifier
 *         price:
 *           type: number
 *           format: decimal
 *           description: Product price
 *         defectiveReturnPrice:
 *           type: number
 *           format: decimal
 *           description: Defective return price
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     PricingStats:
 *       type: object
 *       properties:
 *         last7Days:
 *           type: object
 *           properties:
 *             priceUpdates:
 *               type: integer
 *               description: Number of price updates in last 7 days
 *             orders:
 *               type: integer
 *               description: Number of orders in last 7 days
 *         last30Days:
 *           type: object
 *           properties:
 *             priceUpdates:
 *               type: integer
 *               description: Number of price updates in last 30 days
 *             orders:
 *               type: integer
 *               description: Number of orders in last 30 days
 */

/**
 * @swagger
 * /api/pricing/{productId}/prices:
 *   put:
 *     summary: Update product prices
 *     description: Update the price and defective return price of a specific product
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: New product price
 *                 example: 150.00
 *               defectiveReturnPrice:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: New defective return price
 *                 example: 75.00
 *             required:
 *               - price
 *               - defectiveReturnPrice
 *     responses:
 *       200:
 *         description: Product prices updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         product:
 *                           $ref: '#/components/schemas/Product'
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 product:
 *                   id: "uuid"
 *                   price: 150.00
 *                   defectiveReturnPrice: 75.00
 *                   updatedAt: "2024-01-01T00:00:00Z"
 *               message: "Product prices updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - User doesn't own the product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
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

// Update product prices
router.put(
  "/:productId/prices",
  authenticate,
  validation.updateProductPricesValidation,
  asyncHandler(controller.updateProductPrices)
);

/**
 * @swagger
 * /api/pricing/{productId}/increment-view:
 *   post:
 *     summary: Increment product view count (Test endpoint)
 *     description: Increment the view count for a specific product (for testing purposes)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product view incremented successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: string
 *                           format: uuid
 *                         newCount:
 *                           type: integer
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
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

router.post(
  "/:productId/increment-view",
  authenticate,
  validation.incrementProductViewValidation,
  asyncHandler(controller.incrementProductView)
);

module.exports = router;
