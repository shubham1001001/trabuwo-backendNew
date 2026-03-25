const express = require("express");
const router = express.Router();

const controller = require("./controller");
const validation = require("./validation");

const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, requireRole } = require("../../middleware/auth");

/**
 * @swagger
 * /api/brands:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
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
 *                 example: Nike
 *               logoUrl:
 *                 type: string
 *                 example: https://example.com/logo.png
 *               bannerUrl:
 *                 type: string
 *                 example: https://example.com/banner.png
 *               description:
 *                 type: string
 *                 example: Sports brand
 *               websiteUrl:
 *                 type: string
 *                 example: https://nike.com
 *     responses:
 *       201:
 *         description: Brand created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validation.create,
  asyncHandler(controller.create)
);

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Get all brands (with pagination)
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         example: 0
 *     responses:
 *       200:
 *         description: List of brands
 */
router.get(
  "/",
  asyncHandler(controller.list)
);






/**
 * @swagger
 * /api/brands/active:
 *   get:
 *     summary: Get all active brands (with pagination)
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         example: 0
 *     responses:
 *       200:
 *         description:List of active brands
 */
router.get(
  "/active",
  asyncHandler(controller.activeBrandList)
);

/**
 * @swagger
 * /api/brands/{publicId}:
 *   get:
 *     summary: Get brand by publicId
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Brand details
 *       404:
 *         description: Brand not found
 */
router.get(
  "/:publicId",
  validation.getByPublicId,
  asyncHandler(controller.getByPublicId)
);

/**
 * @swagger
 * /api/brands/{publicId}:
 *   put:
 *     summary: Update a brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               bannerUrl:
 *                 type: string
 *               description:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       404:
 *         description: Brand not found
 */
router.put(
  "/:publicId",
  authenticate,
  requireRole("admin"),
  validation.update,
  asyncHandler(controller.update)
);

/**
 * @swagger
 * /api/brands/{publicId}:
 *   delete:
 *     summary: Delete a brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 *       404:
 *         description: Brand not found
 */
router.delete(
  "/:publicId",
  authenticate,
  requireRole("admin"),
  asyncHandler(controller.remove)
);

module.exports = router;