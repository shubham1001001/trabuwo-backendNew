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
 * /api/faq:
 *   post:
 *     summary: Create a new FAQ
 *     tags: [FAQ]
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
 *               - description
 *               - section
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 description: FAQ title/question
 *                 example: "How do I reset my password?"
 *               description:
 *                 type: string
 *                 description: FAQ answer/content
 *                 example: "You can reset your password by clicking on the 'Forgot Password' link on the login page."
 *               section:
 *                 type: string
 *                 maxLength: 100
 *                 description: Category/section where FAQ belongs
 *                 example: "Account Management"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the FAQ is active
 *     responses:
 *       201:
 *         description: FAQ created successfully
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
  validation.createFaqValidation,
  authenticate,
  asyncHandler(controller.createFaq)
);

/**
 * @swagger
 * /api/faq:
 *   get:
 *     summary: Get all FAQs
 *     tags: [FAQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *         description: Filter FAQs by section
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include inactive FAQs
 *     responses:
 *       200:
 *         description: FAQs retrieved successfully
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
  validation.getAllFaqsValidation,
  asyncHandler(controller.getAllFaqs)
);

/**
 * @swagger
 * /api/faq/sections:
 *   get:
 *     summary: Get all FAQ sections
 *     tags: [FAQ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: FAQ sections retrieved successfully
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
 * /api/faq/{id}:
 *   get:
 *     summary: Get FAQ by ID
 *     tags: [FAQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: FAQ ID
 *     responses:
 *       200:
 *         description: FAQ retrieved successfully
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
  validation.getFaqByIdValidation,
  asyncHandler(controller.getFaqById)
);

/**
 * @swagger
 * /api/faq/{id}:
 *   put:
 *     summary: Update FAQ by ID
 *     tags: [FAQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: FAQ ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 description: FAQ title/question
 *               description:
 *                 type: string
 *                 description: FAQ answer/content
 *               section:
 *                 type: string
 *                 maxLength: 100
 *                 description: Category/section where FAQ belongs
 *               isActive:
 *                 type: boolean
 *                 description: Whether the FAQ is active
 *     responses:
 *       200:
 *         description: FAQ updated successfully
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
  validation.updateFaqValidation,
  authenticate,
  asyncHandler(controller.updateFaqById)
);

/**
 * @swagger
 * /api/faq/{id}:
 *   delete:
 *     summary: Delete FAQ by ID
 *     tags: [FAQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: FAQ ID
 *     responses:
 *       200:
 *         description: FAQ deleted successfully
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
  authenticate,
  validation.deleteFaqValidation,
  asyncHandler(controller.deleteFaqById)
);

module.exports = router;
