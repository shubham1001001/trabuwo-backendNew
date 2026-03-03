const express = require("express");
const multer = require("multer");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

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
 * /api/home-categories/tree:
 *   get:
 *     summary: Get home category tree structure
 *     tags: [HomeCategories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Home category tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Home category tree retrieved successfully"
 *               data: [
 *                 {
 *                   publicId: "019a876e-35d0-7497-853e-2f26e505c6b4",
 *                   name: "Electronics",
 *                   children: [
 *                     {
 *                       publicId: "019a876e-35d0-7497-853e-2f26e505c6b5",
 *                       name: "Smartphones",
 *                       children: []
 *                     }
 *                   ]
 *                 }
 *               ]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/tree", asyncHandler(controller.getHomeCategoryTree));

/**
 * @swagger
 * /api/home-categories/home-page:
 *   get:
 *     summary: Get home categories for home page (public endpoint)
 *     tags: [HomeCategories]
 *     responses:
 *       200:
 *         description: Home categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Home categories retrieved successfully"
 *               data: [
 *                 {
 *                   publicId: "019a876e-35d0-7497-853e-2f26e505c6b4",
 *                   name: "Electronics",
 *                   parentId: null,
 *                   sectionId: 1,
 *                   redirectCategoryId: 1087,
 *                   imgUrl: "https://example.com/image.webp",
 *                   displayOrder: 1,
 *                   isActive: false,
 *                   deviceType: "both",
 *                   filters: {},
 *                   showOnHomePage: true,
 *                   children: [
 *                     {
 *                       publicId: "019a876e-35d0-7497-853e-2f26e505c6b5",
 *                       name: "Smartphones",
 *                       parentId: 1,
 *                       sectionId: 1,
 *                       redirectCategoryId: 1088,
 *                       imgUrl: "https://example.com/smartphones.webp",
 *                       displayOrder: 1,
 *                       isActive: false,
 *                       deviceType: "both",
 *                       filters: {},
 *                       showOnHomePage: true,
 *                       redirectCategory: {
 *                         id: 1088,
 *                         publicId: "019a876e-35d0-7497-853e-2f26e505c6b6",
 *                         name: "Smartphones",
 *                         slug: "smartphones"
 *                       }
 *                     }
 *                   ],
 *                   redirectCategory: {
 *                     id: 1087,
 *                     publicId: "019a876e-35d0-7497-853e-2f26e505c6b7",
 *                     name: "Electronics",
 *                     slug: "electronics"
 *                   }
 *                 }
 *               ]
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/home-page",
  validation.getHomeCategoriesForHomePageValidation,
  asyncHandler(controller.getHomeCategoriesForHomePage)
);

/**
 * @swagger
 * /api/home-categories/section/{sectionId}:
 *   get:
 *     summary: Get home categories by section (public endpoint)
 *     tags: [HomeCategories]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category section ID
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *           enum: [mobile, web, both]
 *         description: Filter by device type
 *     responses:
 *       200:
 *         description: Home categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Home categories retrieved successfully"
 *               data: [
 *                 {
 *                   publicId: "019a876e-35d0-7497-853e-2f26e505c6b4",
 *                   name: "Electronics",
 *                   parentId: null,
 *                   sectionId: 1,
 *                   redirectCategoryId: 1087,
 *                   imgUrl: "https://example.com/image.webp",
 *                   displayOrder: 1,
 *                   isActive: true,
 *                   deviceType: "both",
 *                   filters: {}
 *                 }
 *               ]
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/section/:sectionId",
  validation.getHomeCategoriesBySectionValidation,
  asyncHandler(controller.getHomeCategoriesBySection)
);

// Apply authentication to all routes below
router.use(authenticate);

/**
 * @swagger
 * /api/home-categories:
 *   get:
 *     summary: Get all home categories with filters
 *     tags: [HomeCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: integer
 *         description: Filter by section ID
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: integer
 *           nullable: true
 *         description: Filter by parent ID (use null for root categories)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *           enum: [mobile, web, both]
 *         description: Filter by device type
 *     responses:
 *       200:
 *         description: Home categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/",
  validation.getAllHomeCategoriesValidation,
  asyncHandler(controller.getAllHomeCategories)
);

/**
 * @swagger
 * /api/home-categories:
 *   post:
 *     summary: Create a new home category
 *     tags: [HomeCategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the home category
 *                 example: "Electronics"
 *               parentId:
 *                 type: integer
 *                 description: ID of the parent home category (optional)
 *                 example: 1
 *               sectionId:
 *                 type: integer
 *                 description: ID of the category section (optional)
 *                 example: 1
 *               redirectCategoryId:
 *                 type: integer
 *                 description: ID of the category to redirect to (optional)
 *                 example: 1087
 *               displayOrder:
 *                 type: integer
 *                 description: Display order (optional)
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Active status (optional)
 *                 example: true
 *               showOnHomePage:
 *                 type: boolean
 *                 description: Show on home page (optional)
 *                 example: false
 *               deviceType:
 *                 type: string
 *                 enum: [mobile, web, both]
 *                 description: Device type (optional)
 *                 example: "both"
 *               filters:
 *                 type: object
 *                 description: JSON filters object (optional)
 *                 example: {}
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Home category image file (optional)
 *     responses:
 *       201:
 *         description: Home category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/",
  upload.single("image"),
  validation.createHomeCategoryValidation,
  asyncHandler(controller.createHomeCategory)
);

/**
 * @swagger
 * /api/home-categories/{publicId}:
 *   put:
 *     summary: Update a home category
 *     tags: [HomeCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Home category public ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the home category
 *               parentId:
 *                 type: integer
 *                 description: ID of the parent home category
 *               sectionId:
 *                 type: integer
 *                 description: ID of the category section
 *               redirectCategoryId:
 *                 type: integer
 *                 description: ID of the category to redirect to
 *               displayOrder:
 *                 type: integer
 *                 description: Display order
 *               isActive:
 *                 type: boolean
 *                 description: Active status
 *               showOnHomePage:
 *                 type: boolean
 *                 description: Show on home page
 *               deviceType:
 *                 type: string
 *                 enum: [mobile, web, both]
 *                 description: Device type
 *               filters:
 *                 type: object
 *                 description: JSON filters object
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Home category image file
 *     responses:
 *       200:
 *         description: Home category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/:publicId",
  upload.single("image"),
  validation.updateHomeCategoryValidation,
  asyncHandler(controller.updateHomeCategory)
);

/**
 * @swagger
 * /api/home-categories/{publicId}:
 *   delete:
 *     summary: Delete a home category (soft delete)
 *     tags: [HomeCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Home category public ID
 *     responses:
 *       200:
 *         description: Home category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/:publicId",
  validation.deleteHomeCategoryValidation,
  asyncHandler(controller.deleteHomeCategory)
);

module.exports = router;
