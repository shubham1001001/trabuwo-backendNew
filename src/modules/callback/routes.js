const express = require("express");
const router = express.Router();
const callbackController = require("./controller");
const callbackValidation = require("./validation");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Callback:
 *       type: object
 *       required:
 *         - userId
 *         - mobile
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated callback ID
 *         userId:
 *           type: integer
 *           description: ID of the user requesting callback
 *         mobile:
 *           type: string
 *           description: Mobile number for callback
 *         status:
 *           type: string
 *           enum: [pending, success]
 *           default: pending
 *           description: Current status of the callback
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CallbackCreate:
 *       type: object
 *       required:
 *         - userId
 *         - mobile
 *       properties:
 *         userId:
 *           type: integer
 *           description: ID of the user requesting callback
 *         mobile:
 *           type: string
 *           description: Mobile number for callback
 *         status:
 *           type: string
 *           enum: [pending, success]
 *           default: pending
 *           description: Status of the callback
 *     CallbackUpdate:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, success]
 *           description: New status for the callback
 *     CallbackList:
 *       type: object
 *       properties:
 *         callbacks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Callback'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalItems:
 *               type: integer
 *             itemsPerPage:
 *               type: integer
 */

/**
 * @swagger
 * /callback:
 *   post:
 *     summary: Create a new callback request
 *     tags: [Callback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CallbackCreate'
 *     responses:
 *       201:
 *         description: Callback created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Callback'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  callbackValidation.createCallbackValidation,
  callbackController.createCallback
);

/**
 * @swagger
 * /callback/{id}/status:
 *   put:
 *     summary: Update callback status
 *     tags: [Callback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Callback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CallbackUpdate'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Callback'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Callback not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id/status",
  callbackValidation.updateStatusValidation,
  callbackController.updateCallbackStatus
);

/**
 * @swagger
 * /callback/{id}:
 *   delete:
 *     summary: Delete a callback
 *     tags: [Callback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Callback ID
 *     responses:
 *       200:
 *         description: Callback deleted successfully
 *       404:
 *         description: Callback not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  callbackValidation.deleteCallbackValidation,
  callbackController.deleteCallback
);

/**
 * @swagger
 * /callback:
 *   get:
 *     summary: Get all callbacks with pagination
 *     tags: [Callback]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Callbacks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CallbackList'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  callbackValidation.getAllCallbacksValidation,
  callbackController.getAllCallbacks
);

/**
 * @swagger
 * /callback/{id}:
 *   get:
 *     summary: Get callback by ID
 *     tags: [Callback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Callback ID
 *     responses:
 *       200:
 *         description: Callback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Callback'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Callback not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:id",
  callbackValidation.getCallbackByIdValidation,
  callbackController.getCallbackById
);

module.exports = router;
