const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate, requireRole } = require("../../middleware/auth");
const asyncHandler = require("../../utils/asyncHandler");

router.use(authenticate);

router.post("/opt-in", requireRole("seller"), asyncHandler(controller.optIn));
router.post("/opt-in-mobile", asyncHandler(controller.optInFromMobile));
router.delete(
  "/delete-all-catalogues",
  asyncHandler(controller.deleteAllCataloguesByUserId)
);
router.get(
  "/influencer-promotions",
  validation.getAllInfluencerPromotionsValidation,
  asyncHandler(controller.getAllInfluencerPromotions)
);
router.get(
  "/catalogues-not-in-promotions",
  validation.getCataloguesNotInPromotionsValidation,
  asyncHandler(controller.getCataloguesNotInPromotions)
);
router.get(
  "/opt-ins",
  requireRole("admin"),
  asyncHandler(controller.getOptIns)
);
router.put(
  "/opt-ins/:id",
  requireRole("admin"),
  validation.approveOptInValidation,
  asyncHandler(controller.approveOptIn)
);
router.post(
  "/select-product",
  requireRole("influencer"),
  validation.selectProductValidation,
  asyncHandler(controller.selectProduct)
);
router.get(
  "/my-products",
  requireRole("influencer"),
  asyncHandler(controller.getMyPromotions)
);

/**
 * @swagger
 * /api/influencer-marketing/catalogs:
 *   post:
 *     summary: Add catalogs to influencer promotion
 *     tags: [Influencer Marketing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - catalogues
 *             properties:
 *               catalogues:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - catalogueId
 *                     - commission
 *                   properties:
 *                     catalogueId:
 *                       type: integer
 *                       description: ID of the catalogue
 *                     commission:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                       description: Commission percentage
 *     responses:
 *       200:
 *         description: Catalogs added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/catalogues",
  requireRole("seller"),
  validation.addCatalogsValidation,
  asyncHandler(controller.addCatalogs)
);

/**
 * @swagger
 * /api/influencer-marketing/commissions:
 *   put:
 *     summary: Update commission for multiple influencer promotions
 *     tags: [Influencer Marketing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - commission
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID of the influencer promotion
 *                     commission:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                       description: New commission percentage
 *     responses:
 *       200:
 *         description: Commissions updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/commissions",
  requireRole("seller"),
  validation.updateCommissionsValidation,
  asyncHandler(controller.updateCommissions)
);

/**
 * @swagger
 * /api/influencer-marketing/status:
 *   put:
 *     summary: Update status for multiple influencer promotions
 *     tags: [Influencer Marketing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - status
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   description: Array of influencer promotion IDs
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 description: New status
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/status",
  requireRole("seller"),
  validation.updateStatusValidation,
  asyncHandler(controller.updateStatus)
);




/**
 * @swagger
 * /api/influencer-marketing/reels:
 *   post:
 *     summary: Post a new reel by influencer
 *     tags: [Influencer Marketing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentLink
 *               - contentType
 *             properties:
 *               contentLink:
 *                 type: string
 *                 description: URL of the reel video (S3 or CDN link)
 *                 example: https://cdn.trabuwo.com/reels/reel1.mp4
 *               contentType:
 *                 type: string
 *                 enum: [REEL]
 *                 description: Type of influencer content
 *               catalogueId:
 *                 type: integer
 *                 description: Optional catalogue ID linked to the reel
 *     responses:
 *       201:
 *         description: Reel posted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/reels",
  requireRole("influencer"),
  validation.createReelValidation,
  asyncHandler(controller.createReel)
);
module.exports = router;
