const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/product-shares:
 *   post:
 *     summary: Share a product
 *     description: Record that the authenticated user has shared a product. Re-sharing updates the sharedAt timestamp.
 *     tags: [Product Shares]
 *     operationId: shareProduct
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
 *                 description: The public ID of the product to share
 *     responses:
 *       201:
 *         description: Product shared successfully
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/",
  validation.shareProductValidation,
  asyncHandler(controller.shareProduct)
);

/**
 * @swagger
 * /api/product-shares:
 *   get:
 *     summary: Get shared product list
 *     description: Retrieve a paginated list of products the authenticated user has shared, sorted by most recently shared first.
 *     tags: [Product Shares]
 *     operationId: getSharedProducts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Shared products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  "/",
  validation.getSharedProductsValidation,
  asyncHandler(controller.getSharedProducts)
);

module.exports = router;
