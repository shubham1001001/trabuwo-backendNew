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
 * /api/category-icons:
 *   post:
 *     summary: Create a category icon
 *     tags: [CategoryIcons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [categoryId, image]
 *             properties:
 *               categoryId:
 *                 type: integer
 *               altText:
 *                 type: string
 *               filter:
 *                 type: object
 *                 description: JSON object containing key-value pairs used as metadata or filters for this icon
 *                 example: {"page": "home", "slot": 1}
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
  validation.createCategoryIconValidation,
  controller.createCategoryIcon
);

/**
 * @swagger
 * /api/category-icons/{publicId}:
 *   put:
 *     summary: Update a category icon
 *     tags: [CategoryIcons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category icon public ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *               altText:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *               filter:
 *                 type: object
 *                 description: JSON object containing key-value pairs used as metadata or filters for this icon
 *                 example: {"page": "home", "slot": 2}
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category icon updated successfully
 */
router.put(
  "/:publicId",
  authenticate,
  upload.single("image"),
  validation.updateCategoryIconValidation,
  controller.updateCategoryIcon
);

/**
 * @swagger
 * /api/category-icons/{publicId}:
 *   delete:
 *     summary: Delete a category icon
 *     tags: [CategoryIcons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category icon public ID
 *     responses:
 *       200:
 *         description: Category icon deleted successfully
 */
router.delete(
  "/:publicId",
  authenticate,
  validation.deleteCategoryIconValidation,
  controller.deleteCategoryIcon
);

/**
 * @swagger
 * /api/category-icons/by-category-id/{categoryId}:
 *   get:
 *     summary: Get all icons for a category by ID
 *     tags: [CategoryIcons]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric category ID
 *     responses:
 *       200:
 *         description: Category icons fetched successfully
 */
router.get(
  "/by-category-id/:categoryId",
  validation.getCategoryIconsByCategoryIdValidation,
  controller.getCategoryIconsByCategoryId
);

module.exports = router;


