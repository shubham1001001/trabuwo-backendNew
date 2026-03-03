const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/returns:
 *   post:
 *     summary: Initiate return for an order item
 *     description: Buyer initiates a return for a shipped order item. System automatically creates Shiprocket return order.
 *     tags: [Returns]
 *     operationId: initiateReturn
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderItemPublicId
 *               - reason
 *             properties:
 *               orderItemPublicId:
 *                 type: string
 *                 format: uuid
 *                 example: "01234567-89ab-7def-0123-456789abcdef"
 *                 description: The public ID of the order item to return
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 example: "Product received damaged"
 *                 description: Reason for return (minimum 10 characters)
 *     responses:
 *       201:
 *         description: Return initiated successfully
 *       400:
 *         description: Bad request - Validation error
 *       404:
 *         description: Order item not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/",
  validation.initiateReturnValidation,
  controller.initiateReturn
);

/**
 * @swagger
 * /api/returns:
 *   get:
 *     summary: Get buyer's returns
 *     description: Retrieve all returns initiated by the authenticated buyer
 *     tags: [Returns]
 *     operationId: getMyReturns
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/", controller.getMyReturns);

/**
 * @swagger
 * /api/returns/{id}:
 *   get:
 *     summary: Get return details by ID
 *     description: Get detailed information about a specific return. Accessible by buyer or seller.
 *     tags: [Returns]
 *     operationId: getReturnById
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the return
 *     responses:
 *       200:
 *         description: Return retrieved successfully
 *       400:
 *         description: Bad request - Invalid UUID
 *       404:
 *         description: Return not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/:id",
  validation.getReturnByIdValidation,
  controller.getReturnById
);

/**
 * @swagger
 * /api/returns/{id}/refund:
 *   post:
 *     summary: Process refund for a return
 *     description: Seller processes refund for a return that has been received. Refund is processed via Razorpay.
 *     tags: [Returns]
 *     operationId: processRefund
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the return
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Bad request - Return not in received status or validation error
 *       404:
 *         description: Return or payment not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/:id/refund",
  validation.processRefundValidation,
  controller.processRefund
);

module.exports = router;
