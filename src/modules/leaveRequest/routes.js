const express = require("express");
const router = express.Router();
const leaveRequestController = require("./controller");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");
const {
  createLeaveRequestValidation,
  updateLeaveRequestValidation,
  getLeaveRequestByIdValidation,
  deleteLeaveRequestValidation,
  getLeaveRequestsValidation,
} = require("./validation");

// Protect all routes
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaveRequest:
 *       type: object
 *       required:
 *         - startDate
 *         - endDate
 *         - reason
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated unique identifier
 *         userId:
 *           type: integer
 *           description: ID of the user requesting leave
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of leave (YYYY-MM-DD)
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of leave (YYYY-MM-DD)
 *         reason:
 *           type: string
 *           enum: [unable_to_process_due_to_lockdown, manpower_issue, limited_inventory_stock_issue, production_issue, limited_packaging_materials_issue, personal_reasons, festive_holidays, staff_self_suffering_from_covid, local_strike]
 *           description: Reason for leave request
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the request was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the request was last updated
 *
 *     CreateLeaveRequestRequest:
 *       type: object
 *       required:
 *         - startDate
 *         - endDate
 *         - reason
 *       properties:
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2024-01-17"
 *         reason:
 *           type: string
 *           enum: [unable_to_process_due_to_lockdown, manpower_issue, limited_inventory_stock_issue, production_issue, limited_packaging_materials_issue, personal_reasons, festive_holidays, staff_self_suffering_from_covid, local_strike]
 *           example: "manpower_issue"
 *
 *     UpdateLeaveRequestRequest:
 *       type: object
 *       properties:
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2024-01-17"
 *         reason:
 *           type: string
 *           enum: [unable_to_process_due_to_lockdown, manpower_issue, limited_inventory_stock_issue, production_issue, limited_packaging_materials_issue, personal_reasons, festive_holidays, staff_self_suffering_from_covid, local_strike]
 *           example: "manpower_issue"
 *
 *     LeaveRequestResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/LeaveRequest'
 *         message:
 *           type: string
 *           example: "Leave request created successfully"
 *
 *     LeaveRequestsListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             leaveRequests:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeaveRequest'
 *             pagination:
 *               type: object
 *               properties:
 *                 current_page:
 *                   type: integer
 *                   example: 1
 *                 total_pages:
 *                   type: integer
 *                   example: 5
 *                 total_count:
 *                   type: integer
 *                   example: 50
 *                 limit:
 *                   type: integer
 *                   example: 10
 *         message:
 *           type: string
 *           example: "Leave requests retrieved successfully"
 */

/**
 * @swagger
 * /api/leave-request:
 *   post:
 *     summary: Create a new leave request
 *     tags: [Leave Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeaveRequestRequest'
 *     responses:
 *       201:
 *         description: Leave request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveRequestResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  createLeaveRequestValidation,
  asyncHandler(leaveRequestController.createLeaveRequest)
);

/**
 * @swagger
 * /api/leave-request:
 *   get:
 *     summary: Get user's leave requests with pagination
 *     tags: [Leave Request]
 *     security:
 *       - bearerAuth: []
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
 *         description: User leave requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveRequestsListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  getLeaveRequestsValidation,
  asyncHandler(leaveRequestController.getUserLeaveRequests)
);

/**
 * @swagger
 * /api/leave-request/all:
 *   get:
 *     summary: Get all leave requests with pagination (Admin only)
 *     tags: [Leave Request]
 *     security:
 *       - bearerAuth: []
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
 *         description: All leave requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveRequestsListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/all",
  getLeaveRequestsValidation,
  asyncHandler(leaveRequestController.getAllLeaveRequests)
);

/**
 * @swagger
 * /api/leave-request/{id}:
 *   get:
 *     summary: Get a specific leave request by ID
 *     tags: [Leave Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveRequestResponse'
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:id",
  getLeaveRequestByIdValidation,
  asyncHandler(leaveRequestController.getLeaveRequestById)
);

/**
 * @swagger
 * /api/leave-request/{id}:
 *   put:
 *     summary: Update a leave request (User can only update their own requests)
 *     tags: [Leave Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Leave request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLeaveRequestRequest'
 *     responses:
 *       200:
 *         description: Leave request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveRequestResponse'
 *       400:
 *         description: Validation error or business rule violation
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot update this request
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  updateLeaveRequestValidation,
  asyncHandler(leaveRequestController.updateLeaveRequest)
);

/**
 * @swagger
 * /api/leave-request/{id}:
 *   delete:
 *     summary: Delete a leave request (User can only delete their own requests)
 *     tags: [Leave Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Leave request deleted successfully"
 *                 message:
 *                   type: string
 *                   example: "Leave request deleted successfully"
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot delete this request
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  deleteLeaveRequestValidation,
  asyncHandler(leaveRequestController.deleteLeaveRequest)
);

module.exports = router;
