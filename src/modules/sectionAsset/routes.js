const express = require("express");
const multer = require("multer");
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

/**
 * @swagger
 * /api/section-assets:
 *   post:
 *     summary: Create a section asset
 *     tags: [SectionAssets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [sectionId, redirectCategoryId, deviceType, displayOrder, image]
 *             properties:
 *               sectionId:
 *                 type: integer
 *               redirectCategoryId:
 *                 type: integer
 *               altText:
 *                 type: string
 *               deviceType:
 *                 type: string
 *                 enum: [mobile, web, both]
 *               displayOrder:
 *                 type: integer
 *               enabled:
 *                 type: boolean
 *               filters:
 *                 type: object
 *                 description: JSON object containing key-value pairs of filters to be applied to URL
 *                 example: {"category": "electronics", "price_min": 100}
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  upload.single("image"),
  validation.createAssetValidation,
  controller.createAsset
);

/**
 * @swagger
 * /api/section-assets/{publicId}:
 *   put:
 *     summary: Update a section asset
 *     tags: [SectionAssets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Section asset public ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               sectionId:
 *                 type: integer
 *               redirectCategoryId:
 *                 type: integer
 *               altText:
 *                 type: string
 *               deviceType:
 *                 type: string
 *                 enum: [mobile, web, both]
 *               displayOrder:
 *                 type: integer
 *               enabled:
 *                 type: boolean
 *               filters:
 *                 type: object
 *                 description: JSON object containing key-value pairs of filters to be applied to URL
 *                 example: {"category": "electronics", "price_min": 100}
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Section asset updated successfully
 *       404:
 *         description: Section asset not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/:publicId",
  authenticate,
  upload.single("image"),
  validation.updateAssetValidation,
  controller.updateAsset
);

/**
 * @swagger
 * /api/section-assets/{publicId}:
 *   delete:
 *     summary: Delete a single section asset
 *     tags: [SectionAssets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Section asset public ID
 *     responses:
 *       200:
 *         description: Section asset deleted successfully
 *       404:
 *         description: Section asset not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/:publicId",
  authenticate,
  validation.deleteAssetValidation,
  controller.deleteAsset
);

/**
 * @swagger
 * /api/section-assets/sections/{sectionPublicId}:
 *   delete:
 *     summary: Delete a category section and all its assets
 *     tags: [SectionAssets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionPublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category section public ID
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *       404:
 *         description: Section not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/sections/:sectionPublicId",
  authenticate,
  validation.deleteSectionValidation,
  controller.deleteSection
);

module.exports = router;
