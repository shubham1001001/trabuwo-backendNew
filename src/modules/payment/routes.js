const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

router.post(
  "/create-order",
  validation.createPaymentOrderValidation,
  controller.createPaymentOrder
);

router.post(
  "/verify",
  validation.verifyPaymentValidation,
  controller.verifyPayment
);

router.get(
  "/:paymentId",
  validation.getPaymentValidation,
  controller.getPaymentStatus
);

/**
 * @swagger
 * /api/payment/{id}/refund:
 *   post:
 *     summary: Create a refund for a payment
 *     description: Process a refund for a Razorpay payment. Supports partial and full refunds.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^pay_'
 *         description: Razorpay payment ID (e.g., pay_29QQoUBi66xm2f)
 *         example: pay_29QQoUBi66xm2f
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 100
 *                 description: Refund amount in smallest currency unit (paise for INR). Minimum ₹1.00 (100 paise). If not provided, full refund will be processed.
 *                 example: 500100
 *               speed:
 *                 type: string
 *                 enum: [normal, optimum]
 *                 default: normal
 *                 description: Speed at which refund should be processed. 'normal' takes 5-7 working days, 'optimum' attempts instant refund if possible.
 *                 example: normal
 *               notes:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 maxProperties: 15
 *                 description: Key-value pairs for storing additional information (max 15 pairs)
 *                 example:
 *                   reason: "Return refund"
 *                   orderId: "ORD123"
 *               receipt:
 *                 type: string
 *                 description: Unique identifier for internal reference
 *                 example: "Receipt No. 31"
 *           examples:
 *             fullRefund:
 *               summary: Full refund example
 *               value: {}
 *             partialRefund:
 *               summary: Partial refund example
 *               value:
 *                 amount: 500100
 *                 speed: normal
 *                 notes:
 *                   reason: "Product return"
 *                 receipt: "RCP-001"
 *             instantRefund:
 *               summary: Instant refund example
 *               value:
 *                 amount: 100000
 *                 speed: optimum
 *                 notes:
 *                   reason: "Customer request"
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Refund processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Razorpay refund ID
 *                       example: rfnd_FP8QHiV938haTz
 *                     amount:
 *                       type: integer
 *                       description: Refund amount in smallest currency unit
 *                       example: 500100
 *                     currency:
 *                       type: string
 *                       example: INR
 *                     payment_id:
 *                       type: string
 *                       description: Razorpay payment ID
 *                       example: pay_29QQoUBi66xm2f
 *                     status:
 *                       type: string
 *                       enum: [pending, processed, failed]
 *                       example: processed
 *                     created_at:
 *                       type: integer
 *                       description: Unix timestamp
 *                       example: 1597078866
 *                     speed_requested:
 *                       type: string
 *                       enum: [normal, optimum]
 *                       example: normal
 *                     speed_processed:
 *                       type: string
 *                       enum: [instant, normal]
 *                       example: normal
 *                     receipt:
 *                       type: string
 *                       nullable: true
 *                       example: "Receipt No. 31"
 *                     notes:
 *                       type: object
 *                       nullable: true
 *                       additionalProperties:
 *                         type: string
 *             examples:
 *               success:
 *                 summary: Successful refund response
 *                 value:
 *                   success: true
 *                   message: "Refund processed successfully"
 *                   data:
 *                     id: rfnd_FP8QHiV938haTz
 *                     amount: 500100
 *                     currency: INR
 *                     payment_id: pay_29QQoUBi66xm2f
 *                     status: processed
 *                     created_at: 1597078866
 *                     speed_requested: normal
 *                     speed_processed: normal
 *                     receipt: "Receipt No. 31"
 *       400:
 *         description: Bad request - Validation error or Razorpay API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "The amount must be atleast INR 1.00"
 *                 code:
 *                   type: string
 *                   example: VALIDATION_ERROR
 *             examples:
 *               invalidAmount:
 *                 summary: Amount validation error
 *                 value:
 *                   success: false
 *                   message: "The amount must be atleast INR 1.00"
 *                   code: VALIDATION_ERROR
 *               invalidPaymentId:
 *                 summary: Invalid payment ID format
 *                 value:
 *                   success: false
 *                   message: "Payment ID must be a valid Razorpay payment ID"
 *                   code: VALIDATION_ERROR
 *               paymentNotCaptured:
 *                 summary: Payment not in captured status
 *                 value:
 *                   success: false
 *                   message: "Payment must be in captured status to process refund"
 *                   code: VALIDATION_ERROR
 *               refundAmountExceeded:
 *                 summary: Refund amount exceeds payment amount
 *                 value:
 *                   success: false
 *                   message: "The refund amount provided is greater than amount captured"
 *                   code: VALIDATION_ERROR
 *               alreadyRefunded:
 *                 summary: Payment already fully refunded
 *                 value:
 *                   success: false
 *                   message: "The payment has been fully refunded already"
 *                   code: VALIDATION_ERROR
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Payment not found"
 *                 code:
 *                   type: string
 *                   example: NOT_FOUND_ERROR
 *       500:
 *         description: Internal server error or Razorpay service error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to process refund via Razorpay"
 *                 code:
 *                   type: string
 *                   example: RAZORPAY_ERROR
 */
router.post(
  "/:id/refund",
  validation.createRefundValidation,
  controller.createRefund
);

module.exports = router;
