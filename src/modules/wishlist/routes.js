const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     description: Retrieve all products in the authenticated user's wishlist with full product details including catalogue information
 *     tags: [Wishlist]
 *     operationId: getWishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
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
 *                   example: "Wishlist retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       publicId:
 *                         type: string
 *                         format: uuid
 *                         example: "01234567-89ab-7def-0123-456789abcdef"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-01T16:45:07.000Z"
 *                       product:
 *                         type: object
 *                         properties:
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [active, paused, blocked, activation_pending]
 *                           images:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 imageUrl:
 *                                   type: string
 *                                 isPrimary:
 *                                   type: boolean
 *                                 sortOrder:
 *                                   type: integer
 *                           variants:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 publicId:
 *                                   type: string
 *                                   format: uuid
 *                                 trabuwoPrice:
 *                                   type: number
 *                                 mrp:
 *                                   type: number
 *                                 inventory:
 *                                   type: integer
 *                                 skuId:
 *                                   type: string
 *                           catalogue:
 *                             type: object
 *                             properties:
 *                               publicId:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               thumbnailUrl:
 *                                 type: string
 *                               seller:
 *                                 type: object
 *                                 properties:
 *                                   publicId:
 *                                     type: string
 *                                     format: uuid
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/", controller.getWishlist);

/**
 * @swagger
 * /api/wishlist/items:
 *   post:
 *     summary: Add product to wishlist
 *     description: Add a product to the authenticated user's wishlist. If the product is already in the wishlist, returns a conflict error.
 *     tags: [Wishlist]
 *     operationId: addToWishlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productPublicId
 *             properties:
 *               productPublicId:
 *                 type: string
 *                 format: uuid
 *                 example: "01234567-89ab-7def-0123-456789abcdef"
 *                 description: The public ID of the product to add to wishlist
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
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
 *                   example: "Product added to wishlist successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicId:
 *                       type: string
 *                       format: uuid
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     product:
 *                       type: object
 *                       description: Full product details including catalogue information
 *       400:
 *         description: Bad request - Invalid UUID format
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
 *                   example: "productPublicId must be a valid UUID"
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
 *                   example: "Product with ID 01234567-89ab-7def-0123-456789abcdef not found"
 *       409:
 *         description: Conflict - Product already in wishlist
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
 *                   example: "Product is already in wishlist"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/items",
  validation.addToWishlistValidation,
  controller.addToWishlist
);

/**
 * @swagger
 * /api/wishlist/items/{productPublicId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     description: Remove a product from the authenticated user's wishlist by product public ID
 *     tags: [Wishlist]
 *     operationId: removeFromWishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productPublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the product to remove from wishlist
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
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
 *                   example: "Product removed from wishlist successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Product removed from wishlist successfully"
 *       400:
 *         description: Bad request - Invalid UUID format
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
 *                   example: "productPublicId must be a valid UUID"
 *       404:
 *         description: Product not found or not in wishlist
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
 *                   example: "Product is not in your wishlist"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/items/:productPublicId",
  validation.removeFromWishlistValidation,
  controller.removeFromWishlist
);

module.exports = router;
