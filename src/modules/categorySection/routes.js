const express = require("express");
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/category-sections:
 *   post:
 *     summary: Create a category section
 *     tags: [CategorySections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, name, displayOrder]
 *             properties:
 *               categoryId:
 *                 type: integer
 *               name:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *               layout:
 *                 type: string
 *                 enum: [horizontal, grid]
 *                 default: grid
 *               column:
 *                 type: integer
 *                 default: 3
 *               isActive:
 *                 type: boolean
 *               filter:
 *                 type: object
 *                 description: JSONB filter object. Each key's value is stored as an array (scalars become single-element arrays).
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  validation.createSectionValidation,
  controller.createSection
);

/**
 * @swagger
 * /api/category-sections/{publicId}:
 *   put:
 *     summary: Update a category section
 *     tags: [CategorySections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category section public ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *               name:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *               layout:
 *                 type: string
 *                 enum: [horizontal, grid]
 *               column:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               filter:
 *                 type: object
 *                 description: JSONB filter object. Each key's value is stored as an array (scalars become single-element arrays).
 *     responses:
 *       200:
 *         description: Category section updated successfully
 *       404:
 *         description: Category section not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/:publicId",
  authenticate,
  validation.updateSectionValidation,
  controller.updateSection
);

/**
 * @swagger
 * /api/category-sections/public/{categoryId}:
 *   get:
 *     summary: Get sections with assets for a category
 *     tags: [CategorySections]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: integer
 *         required: false
 *         description: Category ID (if omitted, defaults to 769)
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *           enum: [mobile, web, both]
 *         description: Filter assets by device type
 *       - in: query
 *         name: age_group
 *         schema:
 *           type: string
 *         description: Filter key-value pairs. Section is returned only if its stored filter (per key) exactly matches the requested values for that key (same set, no extra values). One value in URL matches only sections that have exactly that one value.
 *     responses:
 *       200:
 *         description: Sections fetched
 */
router.get(
  "/public",
  validation.getPublicByCategoryValidation,
  controller.getPublicByCategory
);

router.get(
  "/public/:categoryId",
  validation.getPublicByCategoryValidation,
  controller.getPublicByCategory
);

module.exports = router;
