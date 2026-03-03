const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get("/", controller.getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productVariantId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 */
router.post("/items", validation.addToCartValidation, controller.addToCart);

/**
 * @swagger
 * /api/cart/items/{productVariantId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productVariantId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 */
router.put(
  "/items/:productVariantId",
  validation.updateCartItemValidation,
  controller.updateCartItem
);

/**
 * @swagger
 * /api/cart/items/{productVariantId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productVariantId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 */
router.delete(
  "/items/:productVariantId",
  validation.removeFromCartValidation,
  controller.removeFromCart
);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete("/", controller.clearCart);

module.exports = router;
