const express = require("express");
const multer = require("multer");
const controller = require("./controller");
const validation = require("./validation");
const { authenticate: auth } = require("../../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       required:
 *         - title
 *         - section
 *         - position
 *         - startTime
 *         - endTime
 *       properties:
 *         id:
 *           type: integer
 *           description: Banner ID
 *         title:
 *           type: string
 *           description: Banner title
 *         description:
 *           type: string
 *           description: Banner description
 *         section:
 *           type: string
 *           enum: [homepage, category, product, search, checkout, profile]
 *           description: Section where banner appears
 *         position:
 *           type: integer
 *           description: Display order/position
 *         isActive:
 *           type: boolean
 *           description: Whether banner is active
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: When banner should start showing
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: When banner should stop showing
 *         clickUrl:
 *           type: string
 *           description: URL to redirect when banner is clicked
 *         smallImageUrl:
 *           type: string
 *           description: Small size image URL (320px)
 *         mediumImageUrl:
 *           type: string
 *           description: Medium size image URL (768px)
 *         largeImageUrl:
 *           type: string
 *           description: Large size image URL (1200px)
 *         fallbackImageUrl:
 *           type: string
 *           description: Fallback JPEG image URL
 */

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Create a new banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - section
 *               - position
 *               - startTime
 *               - endTime
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               section:
 *                 type: string
 *                 enum: [homepage, category, product, search, checkout, profile]
 *               position:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               clickUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  auth,
  upload.single("image"),
  validation.createBannerValidation,
  controller.createBanner
);

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Get all banners
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [homepage, category, product, search, checkout, profile]
 *         description: Filter by section
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: currentTime
 *         schema:
 *           type: boolean
 *         description: Filter by current time (active banners)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 */
router.get("/", validation.getAllBannersValidation, controller.getAllBanners);

/**
 * @swagger
 * /api/banners/{id}:
 *   get:
 *     summary: Get banner by ID
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
 *       404:
 *         description: Banner not found
 */
router.get(
  "/:id",
  validation.getBannerByIdValidation,
  controller.getBannerById
);

/**
 * @swagger
 * /api/banners/section/{section}:
 *   get:
 *     summary: Get banners by section
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *           enum: [homepage, category, product, search, checkout, profile]
 *         description: Section name
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 */
router.get(
  "/section/:section",
  validation.getBannersBySectionValidation,
  controller.getBannersBySection
);

/**
 * @swagger
 * /api/banners/{id}:
 *   put:
 *     summary: Update banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Banner ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               section:
 *                 type: string
 *                 enum: [homepage, category, product, search, checkout, profile]
 *               position:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               clickUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         description: Banner not found
 */
router.put(
  "/:id",
  auth,
  upload.single("image"),
  validation.updateBannerValidation,
  controller.updateBanner
);

/**
 * @swagger
 * /api/banners/{id}:
 *   delete:
 *     summary: Soft delete banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       404:
 *         description: Banner not found
 */
router.delete(
  "/:id",
  auth,
  validation.softDeleteBannerValidation,
  controller.softDeleteBanner
);

/**
 * @swagger
 * /api/banners/{id}/activate:
 *   put:
 *     summary: Activate or deactivate banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Banner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Banner active status
 *     responses:
 *       200:
 *         description: Banner status updated successfully
 *       404:
 *         description: Banner not found
 */
router.put(
  "/:id/activate",
  auth,
  validation.activateDeactivateBannerValidation,
  controller.activateDeactivateBanner
);

/**
 * @swagger
 * /api/banners/count:
 *   get:
 *     summary: Get banner count
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [homepage, category, product, search, checkout, profile]
 *         description: Filter by section
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Banner count retrieved successfully
 */
router.get("/count", controller.getBannerCount);

/**
 * @swagger
 * /api/banners/active/count:
 *   get:
 *     summary: Get active banners count
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: Active banners count retrieved successfully
 */
router.get("/active/count", controller.getActiveBannersCount);

/**
 * @swagger
 * /api/banners/bulk-update:
 *   put:
 *     summary: Bulk update banners
 *     tags: [Banners]
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
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     position:
 *                       type: integer
 *                     isActive:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Banners updated successfully
 */
router.put(
  "/bulk-update",
  auth,
  validation.bulkUpdateBannersValidation,
  controller.bulkUpdateBanners
);

module.exports = router;
