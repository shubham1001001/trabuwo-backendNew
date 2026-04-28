const express = require("express");
const controller = require("./controller");
const validation = require("./validation");
const { authenticate: auth, requireRole } = require("../../middleware/auth");

const router = express.Router();

// ──────── Public Routes (for buyer/seller apps) ────────

/**
 * @swagger
 * /api/platform-config/pricing:
 *   get:
 *     summary: Get public pricing config (shipping, platform fee, COD fee)
 *     tags: [Platform Config]
 *     responses:
 *       200:
 *         description: Pricing config retrieved successfully
 */
router.get("/pricing", controller.getPublicPricingConfig);
router.get("/calculator", controller.getCalculatorConfig);
router.get("/calculator/:categoryId", controller.getCalculatorConfig);

// ──────── Admin Routes ────────

/**
 * @swagger
 * /api/platform-config:
 *   get:
 *     summary: Get all platform configs (admin)
 *     tags: [Platform Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (pricing, commission, logistics, payout, reseller)
 *     responses:
 *       200:
 *         description: Configs retrieved successfully
 */
router.get(
  "/",
  auth,
  requireRole("admin"),
  validation.getCategoryQueryValidation,
  controller.getAllConfigs
);

/**
 * @swagger
 * /api/platform-config:
 *   post:
 *     summary: Create a new config entry (admin)
 *     tags: [Platform Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               valueType:
 *                 type: string
 *                 enum: [number, percentage, boolean, json]
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Config created successfully
 */
router.post(
  "/",
  auth,
  requireRole("admin"),
  validation.createConfigValidation,
  controller.createConfig
);

/**
 * @swagger
 * /api/platform-config/{key}:
 *   put:
 *     summary: Update a config value (admin)
 *     tags: [Platform Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Config updated successfully
 */
router.put(
  "/:key",
  auth,
  requireRole("admin"),
  validation.updateConfigValidation,
  controller.updateConfig
);

// ──────── Category Commission Routes ────────

/**
 * @swagger
 * /api/platform-config/category-commissions:
 *   get:
 *     summary: Get all category commissions (admin)
 *     tags: [Platform Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category commissions retrieved successfully
 */
router.get(
  "/category-commissions",
  auth,
  requireRole("admin"),
  controller.getAllCategoryCommissions
);

/**
 * @swagger
 * /api/platform-config/category-commissions/{categoryId}:
 *   put:
 *     summary: Set or update category commission rate (admin)
 *     tags: [Platform Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [commissionRate]
 *             properties:
 *               commissionRate:
 *                 type: number
 *                 description: Commission rate as percentage (e.g. 5 = 5%)
 *     responses:
 *       200:
 *         description: Category commission updated
 */
router.put(
  "/category-commissions/:categoryId",
  auth,
  requireRole("admin"),
  validation.upsertCategoryCommissionValidation,
  controller.upsertCategoryCommission
);

/**
 * @swagger
 * /api/platform-config/category-commissions/{categoryId}:
 *   delete:
 *     summary: Remove category commission (falls back to default)
 *     tags: [Platform Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category commission removed
 */
router.delete(
  "/category-commissions/:categoryId",
  auth,
  requireRole("admin"),
  validation.deleteCategoryCommissionValidation,
  controller.deleteCategoryCommission
);

module.exports = router;
