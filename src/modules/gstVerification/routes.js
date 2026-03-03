const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, requireRole } = require("../../middleware/auth");

router.use(authenticate);
router.use(requireRole("buyer"));

/**
 * @swagger
 * /api/gst/verification:
 *   post:
 *     summary: Verify GSTIN or EID/UIN and store details
 *     description: >
 *       Calls the GSTIN_CHECK service with the provided identifier, derives whether it is a GSTIN or EID/UIN
 *       based on dealer type, stores normalized details in the database linked to the seller onboarding of
 *       the authenticated user, and returns the stored details.
 *     tags: [GST Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idValue
 *             properties:
 *               idValue:
 *                 type: string
 *                 description: GSTIN or EID/UIN to verify
 *                 example: "03FJEPK3490J1Z4"
 *     responses:
 *       201:
 *         description: Verification completed and stored
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
 *                     publicId:
 *                       type: string
 *                     idType:
 *                       type: string
 *                       enum: [GSTIN, EID]
 *                     idValue:
 *                       type: string
 *                     gstin:
 *                       type: string
 *                       nullable: true
 *                     legalName:
 *                       type: string
 *                       nullable: true
 *                     tradeName:
 *                       type: string
 *                       nullable: true
 *                     registrationDate:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       nullable: true
 *                     taxpayerType:
 *                       type: string
 *                       nullable: true
 *                     einvoiceStatus:
 *                       type: string
 *                       nullable: true
 *                     principalAddress:
 *                       type: object
 *                       properties:
 *                         adr:
 *                           type: string
 *                           nullable: true
 *                         loc:
 *                           type: string
 *                           nullable: true
 *                         pincode:
 *                           type: string
 *                           nullable: true
 *                         state:
 *                           type: string
 *                           nullable: true
 *                         district:
 *                           type: string
 *                           nullable: true
 *                         street:
 *                           type: string
 *                           nullable: true
 *                         city:
 *                           type: string
 *                           nullable: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/verification",
  validation.verifyAndStoreValidation,
  asyncHandler(controller.verifyAndStore)
);

/**
 * @swagger
 * /api/gst/verification:
 *   get:
 *     summary: Get GST/EID verification details for current seller
 *     description: >
 *       Returns the stored GSTIN/EID/UIN verification details for the seller onboarding
 *       associated with the authenticated user.
 *     tags: [GST Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification details found
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
 *                     publicId:
 *                       type: string
 *                     idType:
 *                       type: string
 *                       enum: [GSTIN, EID]
 *                     idValue:
 *                       type: string
 *                     gstin:
 *                       type: string
 *                       nullable: true
 *                     legalName:
 *                       type: string
 *                       nullable: true
 *                     tradeName:
 *                       type: string
 *                       nullable: true
 *                     registrationDate:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       nullable: true
 *                     taxpayerType:
 *                       type: string
 *                       nullable: true
 *                     einvoiceStatus:
 *                       type: string
 *                       nullable: true
 *                     principalAddress:
 *                       type: object
 *                       properties:
 *                         adr:
 *                           type: string
 *                           nullable: true
 *                         loc:
 *                           type: string
 *                           nullable: true
 *                         pincode:
 *                           type: string
 *                           nullable: true
 *                         state:
 *                           type: string
 *                           nullable: true
 *                         district:
 *                           type: string
 *                           nullable: true
 *                         street:
 *                           type: string
 *                           nullable: true
 *                         city:
 *                           type: string
 *                           nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/verification", asyncHandler(controller.getCurrent));

module.exports = router;

