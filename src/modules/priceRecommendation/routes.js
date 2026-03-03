const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/pricing/recommendations:
 *   get:
 *     summary: Get price recommendations for a category
 *     description: Returns percentile stats (p10, p25, p50, p75, p90) computed nightly per category.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category publicId
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
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
 *                         categoryId:
 *                           type: string
 *                           format: uuid
 *                         count:
 *                           type: integer
 *                         min:
 *                           type: number
 *                         p10:
 *                           type: number
 *                         p25:
 *                           type: number
 *                         p50:
 *                           type: number
 *                         p75:
 *                           type: number
 *                         p90:
 *                           type: number
 *                         max:
 *                           type: number
 *                         suggestedPrice:
 *                           type: number
 */

router.get(
  "/recommendations",
  authenticate,
  validation.getRecommendationsValidation,
  asyncHandler(controller.getCategoryRecommendations)
);

module.exports = router;
