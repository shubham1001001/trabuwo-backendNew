const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/training/available-slots:
 *   get:
 *     summary: Get available training slots
 *     description: Retrieve available training slots with optional filtering by language and date.
 *     tags: [Training]
 *     operationId: getAvailableTrainingSlots
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [ENGLISH, HINDI]
 *         description: Filter by training language
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       language:
 *                         type: string
 *                       startTimestamp:
 *                         type: string
 *                         format: date-time
 *                       endTimestamp:
 *                         type: string
 *                         format: date-time
 *                       isBooked:
 *                         type: boolean
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   language: "ENGLISH"
 *                   startTimestamp: "2025-07-16T11:00:00.000Z"
 *                   endTimestamp: "2025-07-16T12:00:00.000Z"
 *                   isBooked: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/available-slots",
  validation.getAvailableSlotsValidation,
  asyncHandler(controller.getAvailableTrainingSlots)
);

/**
 * @swagger
 * /api/training/slots/{id}/book:
 *   post:
 *     summary: Book a training slot
 *     description: Book a specific training slot by its ID for the authenticated user.
 *     tags: [Training]
 *     operationId: bookTrainingSlot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the training slot to book
 *     responses:
 *       200:
 *         description: Training slot booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     language:
 *                       type: string
 *                     startTimestamp:
 *                       type: string
 *                       format: date-time
 *                     endTimestamp:
 *                       type: string
 *                       format: date-time
 *                     isBooked:
 *                       type: boolean
 *                     bookedBy:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *       400:
 *         description: Cannot book past training slots
 *       404:
 *         description: Training slot not found
 *       409:
 *         description: Training slot already booked or user has existing booking
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/slots/:id/book",
  validation.bookTrainingSlotValidation,
  asyncHandler(controller.bookTrainingSlot)
);

/**
 * @swagger
 * /api/training/my-slots:
 *   get:
 *     summary: Get user's booked training slots
 *     description: Retrieve all training slots booked by the authenticated user.
 *     tags: [Training]
 *     operationId: getUserBookedSlots
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       language:
 *                         type: string
 *                       startTimestamp:
 *                         type: string
 *                         format: date-time
 *                       endTimestamp:
 *                         type: string
 *                         format: date-time
 *                       isBooked:
 *                         type: boolean
 *                       bookedBy:
 *                         type: object
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   language: "ENGLISH"
 *                   startTimestamp: "2025-07-16T11:00:00.000Z"
 *                   endTimestamp: "2025-07-16T12:00:00.000Z"
 *                   isBooked: true
 *                   bookedBy:
 *                     id: 1
 *                     email: "user@example.com"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/my-slots", asyncHandler(controller.getUserBookedSlots));

/**
 * @swagger
 * /api/training/slots:
 *   post:
 *     summary: Create a training slot (Admin)
 *     description: Create a new training slot. This endpoint is typically used by admins.
 *     tags: [Training]
 *     operationId: createTrainingSlot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *               - startTimestamp
 *               - endTimestamp
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [ENGLISH, HINDI]
 *               startTimestamp:
 *                 type: string
 *                 format: date-time
 *               endTimestamp:
 *                 type: string
 *                 format: date-time
 *           example:
 *             language: "ENGLISH"
 *             startTimestamp: "2025-07-16T11:00:00.000Z"
 *             endTimestamp: "2025-07-16T12:00:00.000Z"
 *     responses:
 *       201:
 *         description: Training slot created successfully
 *       400:
 *         description: Invalid input (end time must be after start time, start time must be in future)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/slots",
  validation.createTrainingSlotValidation,
  asyncHandler(controller.createTrainingSlot)
);

module.exports = router;
