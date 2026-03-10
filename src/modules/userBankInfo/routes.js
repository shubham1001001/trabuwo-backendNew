const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/user-bank-info/bank-details:
 *   put:
 *     summary: Create or update bank details
 *     description: Upsert bank account details for the authenticated user. Bank details are encrypted at rest.
 *     tags: [User Bank Info]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - ifsc
 *               - accountHolderName
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 minLength: 9
 *                 maxLength: 18
 *                 pattern: '^\d+$'
 *                 description: Bank account number (9-18 digits)
 *                 example: "123456789012"
 *               ifsc:
 *                 type: string
 *                 pattern: '^[A-Z]{4}0[A-Z0-9]{6}$'
 *                 description: IFSC code in format AAAA0XXXXXX
 *                 example: "HDFC0001234"
 *               accountHolderName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Account holder's full name
 *                 example: "John Doe"
 *     responses:
 *       200:
 *         description: Bank details updated successfully
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
 *                   example: "Bank details updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicId:
 *                       type: string
 *                       format: uuid
 *                       description: Public identifier for the bank info record
 *                     bankAccountNumber:
 *                       type: string
 *                       description: Masked account number (last 4 digits visible)
 *                       example: "****9012"
 *                     bankIfsc:
 *                       type: string
 *                       example: "HDFC0001234"
 *                     bankAccountHolderName:
 *                       type: string
 *                       example: "John Doe"
 *                     upiId:
 *                       type: string
 *                       nullable: true
 *                       example: "user@paytm"
 *                     upiName:
 *                       type: string
 *                       nullable: true
 *                       example: "John Doe"
 *       400:
 *         description: Validation error
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
 *                   example: "Validation error"
 *                 code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/bank-details", validation.upsertBankDetailsValidation, controller.upsertBankDetails);

/**
 * @swagger
 * /api/user-bank-info/upi-details:
 *   put:
 *     summary: Create or update UPI details
 *     description: Upsert UPI payment details for the authenticated user. UPI details are encrypted at rest.
 *     tags: [User Bank Info]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - upiId
 *               - upiName
 *             properties:
 *               upiId:
 *                 type: string
 *                 pattern: '^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$'
 *                 description: UPI ID in format user@provider
 *                 example: "user@paytm"
 *               upiName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: UPI display name
 *                 example: "John Doe"
 *     responses:
 *       200:
 *         description: UPI details updated successfully
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
 *                   example: "UPI details updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicId:
 *                       type: string
 *                       format: uuid
 *                       description: Public identifier for the bank info record
 *                     bankAccountNumber:
 *                       type: string
 *                       nullable: true
 *                       description: Masked account number (last 4 digits visible)
 *                       example: "****9012"
 *                     bankIfsc:
 *                       type: string
 *                       nullable: true
 *                       example: "HDFC0001234"
 *                     bankAccountHolderName:
 *                       type: string
 *                       nullable: true
 *                       example: "John Doe"
 *                     upiId:
 *                       type: string
 *                       example: "user@paytm"
 *                     upiName:
 *                       type: string
 *                       example: "John Doe"
 *       400:
 *         description: Validation error
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
 *                   example: "Validation error"
 *                 code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/upi-details", validation.upsertUpiDetailsValidation, controller.upsertUpiDetails);





/**
 * @swagger
 * /api/user-bank-info/my-bank-upi-details:
 *   get:
 *     summary: Get my bank and UPI details
 *     description: Returns bank account and UPI details for the authenticated user.
 *     tags: [User Bank Info]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank and UPI details fetched successfully
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
 *                   example: "Bank and UPI details fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicId:
 *                       type: string
 *                       format: uuid
 *                     bankAccountNumber:
 *                       type: string
 *                       nullable: true
 *                       example: "****9012"
 *                     bankIfsc:
 *                       type: string
 *                       nullable: true
 *                       example: "HDFC0001234"
 *                     bankAccountHolderName:
 *                       type: string
 *                       nullable: true
 *                       example: "John Doe"
 *                     upiId:
 *                       type: string
 *                       nullable: true
 *                       example: "user@paytm"
 *                     upiName:
 *                       type: string
 *                       nullable: true
 *                       example: "John Doe"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/my-bank-upi-details", controller.getMyBankAndUpiDetails);
module.exports = router;
