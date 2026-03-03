const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/product-stock-notifications:
 *   get:
 *     summary: Get user's stock notification subscriptions
 *     description: Retrieve all active stock notification subscriptions for the authenticated user
 *     tags: [Product Stock Notifications]
 *     operationId: getStockNotifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock notifications retrieved successfully
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
 *                   example: "Stock notifications retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       publicId:
 *                         type: string
 *                         format: uuid
 *                       isNotified:
 *                         type: boolean
 *                       notifiedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       productVariant:
 *                         type: object
 *                         properties:
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                           trabuwoPrice:
 *                             type: number
 *                           mrp:
 *                             type: number
 *                           inventory:
 *                             type: integer
 *                           skuId:
 *                             type: string
 *                           product:
 *                             type: object
 *                             properties:
 *                               publicId:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               images:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     imageUrl:
 *                                       type: string
 *                                     isPrimary:
 *                                       type: boolean
 *                                     sortOrder:
 *                                       type: integer
 *                               catalogue:
 *                                 type: object
 *                                 properties:
 *                                   publicId:
 *                                     type: string
 *                                     format: uuid
 *                                   name:
 *                                     type: string
 *                                   status:
 *                                     type: string
 *                                   thumbnailUrl:
 *                                     type: string
 *                                   category:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: integer
 *                                       name:
 *                                         type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/", controller.getNotifications);

/**
 * @swagger
 * /api/product-stock-notifications:
 *   post:
 *     summary: Subscribe to product variant stock notification
 *     description: Subscribe to receive email notification when a product variant comes back in stock. The variant must be out of stock (inventory = 0).
 *     tags: [Product Stock Notifications]
 *     operationId: subscribeToStockNotification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productVariantPublicId
 *             properties:
 *               productVariantPublicId:
 *                 type: string
 *                 format: uuid
 *                 example: "01234567-89ab-7def-0123-456789abcdef"
 *                 description: The public ID of the product variant to subscribe to
 *     responses:
 *       201:
 *         description: Subscribed to stock notification successfully
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
 *                   example: "Subscribed to stock notification successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicId:
 *                       type: string
 *                       format: uuid
 *                     productVariant:
 *                       type: object
 *       400:
 *         description: Bad request - Invalid UUID format or variant already in stock
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
 *                   example: "Product variant is already in stock"
 *       404:
 *         description: Product variant not found
 *       409:
 *         description: Conflict - Already subscribed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/",
  validation.subscribeToVariantValidation,
  controller.subscribeToVariant
);

/**
 * @swagger
 * /api/product-stock-notifications/{notificationPublicId}:
 *   delete:
 *     summary: Unsubscribe from stock notification
 *     description: Unsubscribe from receiving stock notification for a specific product variant
 *     tags: [Product Stock Notifications]
 *     operationId: unsubscribeFromStockNotification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationPublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the notification subscription to unsubscribe from
 *     responses:
 *       200:
 *         description: Unsubscribed from stock notification successfully
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
 *                   example: "Unsubscribed from stock notification successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       400:
 *         description: Bad request - Invalid UUID format
 *       404:
 *         description: Notification subscription not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/:notificationPublicId",
  validation.unsubscribeFromVariantValidation,
  controller.unsubscribeFromVariant
);

module.exports = router;
