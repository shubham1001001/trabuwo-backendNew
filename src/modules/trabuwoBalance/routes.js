const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/trabuwo-balance:
 *   get:
 *     summary: Get Trabuwo balance
 *     description: Returns the buyer's Trabuwo credit balance and transaction history. Balance is credited on order cancellation, return refund, or RTO.
 *     tags: [Trabuwo Balance]
 *     operationId: getBalanceSummary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 795.00
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           publicId:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           type:
 *                             type: string
 *                             enum: [credit, debit]
 *                           reason:
 *                             type: string
 *                             enum: [order_cancelled, return_refund, rto_refund, purchase, cashback, adjustment]
 *                           balanceAfter:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", controller.getBalanceSummary);

module.exports = router;
