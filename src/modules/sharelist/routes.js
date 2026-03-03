const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/sharelist:
 *   get:
 *     summary: Get user's sharelist
 *     description: Retrieve all catalogues in the authenticated user's sharelist with seller info
 *     tags: [Sharelist]
 *     operationId: getSharelist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sharelist retrieved successfully
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
 *                   example: "Sharelist retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       catalogue:
 *                         type: object
 *                         properties:
 *                           publicId:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           thumbnailUrl:
 *                             type: string
 *                           minPrice:
 *                             type: number
 *                           maxPrice:
 *                             type: number
 *                           reviewsCount:
 *                             type: number
 *                           averageRating:
 *                             type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/", controller.getSharelist);

/**
 * @swagger
 * /api/sharelist/items:
 *   post:
 *     summary: Add catalogue to sharelist
 *     description: Add a catalogue to the authenticated user's sharelist using catalogue public UUID.
 *     tags: [Sharelist]
 *     operationId: addToSharelist
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
 *             properties:
 *               catalogueId:
 *                 type: string
 *                 format: uuid
 *                 example: "01234567-89ab-7def-0123-456789abcdef"
 *                 description: The public ID of the catalogue to add
 *     responses:
 *       200:
 *         description: Catalogue added to sharelist successfully
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
 *                   example: "Catalogue added to sharelist successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       catalogue:
 *                         type: object
 *                         description: Catalogue details
 *       400:
 *         description: Bad request - Invalid UUID format
 *       404:
 *         description: Catalogue not found
 *       409:
 *         description: Conflict - Catalogue already in sharelist
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/items",
  validation.addToSharelistValidation,
  controller.addToSharelist
);

module.exports = router;
