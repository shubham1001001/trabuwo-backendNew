const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

// Apply authentication to all routes
// router.use(authenticate);

/**
 * @swagger
 * /api/tutorial-videos:
 *   post:
 *     summary: Create a new tutorial video
 *     tags: [TutorialVideos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - name
 *               - description
 *               - section
 *             properties:
 *               url:
 *                 type: string
 *                 maxLength: 500
 *                 description: Video URL/link
 *                 example: "https://www.youtube.com/watch?v=example123"
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 description: Video title/name
 *                 example: "How to Create a Product Listing"
 *               description:
 *                 type: string
 *                 description: Video description/content
 *                 example: "Learn how to create and manage product listings in our platform"
 *               section:
 *                 type: string
 *                 enum: [learning_hub, influencer_marketing, product_management, order_management, payment_billing]
 *                 description: Category/section where video belongs
 *                 example: "product_management"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the video is active
 *     responses:
 *       201:
 *         description: Tutorial video created successfully
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
  validation.createTutorialVideoValidation,
  authenticate,
  asyncHandler(controller.createTutorialVideo)
);

/**
 * @swagger
 * /api/tutorial-videos:
 *   get:
 *     summary: Get all tutorial videos
 *     tags: [TutorialVideos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [learning_hub, influencer_marketing, product_management, order_management, payment_billing]
 *         description: Filter videos by section
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include inactive videos
 *     responses:
 *       200:
 *         description: Tutorial videos retrieved successfully
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
  validation.getAllTutorialVideosValidation,
  asyncHandler(controller.getAllTutorialVideos)
);

/**
 * @swagger
 * /api/tutorial-videos/sections:
 *   get:
 *     summary: Get all tutorial video sections
 *     tags: [TutorialVideos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tutorial video sections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/sections", asyncHandler(controller.getSections));

/**
 * @swagger
 * /api/tutorial-videos/{id}:
 *   get:
 *     summary: Get tutorial video by ID
 *     tags: [TutorialVideos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tutorial video ID
 *     responses:
 *       200:
 *         description: Tutorial video retrieved successfully
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
router.get(
  "/:id",
  validation.getTutorialVideoByIdValidation,
  asyncHandler(controller.getTutorialVideoById)
);

/**
 * @swagger
 * /api/tutorial-videos/{id}:
 *   put:
 *     summary: Update tutorial video by ID
 *     tags: [TutorialVideos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tutorial video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 maxLength: 500
 *                 description: Video URL/link
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 description: Video title/name
 *               description:
 *                 type: string
 *                 description: Video description/content
 *               section:
 *                 type: string
 *                 enum: [learning_hub, influencer_marketing, product_management, order_management, payment_billing]
 *                 description: Category/section where video belongs
 *               isActive:
 *                 type: boolean
 *                 description: Whether the video is active
 *     responses:
 *       200:
 *         description: Tutorial video updated successfully
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
  "/:id",
  validation.updateTutorialVideoValidation,
  authenticate,
  asyncHandler(controller.updateTutorialVideoById)
);

/**
 * @swagger
 * /api/tutorial-videos/{id}:
 *   delete:
 *     summary: Delete tutorial video by ID
 *     tags: [TutorialVideos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tutorial video ID
 *     responses:
 *       200:
 *         description: Tutorial video deleted successfully
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
router.delete(
  "/:id",
  validation.deleteTutorialVideoValidation,
  authenticate,
  asyncHandler(controller.deleteTutorialVideoById)
);

module.exports = router;
