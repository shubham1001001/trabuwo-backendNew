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
 * /api/seller-onboarding/onboarding:
 *   post:
 *     summary: Start seller onboarding
 *     description: Create onboarding for the authenticated user.
 *     tags: [Seller Onboarding]
 *     operationId: createSellerOnboarding
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerOnboardingCreateRequest'
 *           example: {}
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerOnboardingResponse'
 *             example:
 *               success: true
 *               message: Seller onboarding created
 *               data:
 *                 id: 1
 *                 userId: 1
 *                 currentStep: TAX_IDENTITY
 *                 createdAt: 2024-01-01T00:00:00.000Z
 *       409:
 *         description: Already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: Seller onboarding already exists
 *               error: CONFLICT
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/onboarding", asyncHandler(controller.createSellerOnboarding));

/**
 * @swagger
 * /api/seller-onboarding/onboarding:
 *   get:
 *     summary: Get seller onboarding
 *     description: Get onboarding info for the authenticated user.
 *     tags: [Seller Onboarding]
 *     operationId: getSellerOnboarding
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerOnboardingResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: Seller onboarding not found
 *               error: NOT_FOUND
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/onboarding", asyncHandler(controller.getSellerOnboardingByUserId));

/**
 * @swagger
 * /api/seller-onboarding/tax-identity:
 *   post:
 *     summary: Add tax identity
 *     description: Add GST or UIN for onboarding.
 *     tags: [Seller Onboarding]
 *     operationId: createTaxIdentity
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaxIdentityCreateRequest'
 *           example:
 *             type: GST_NUMBER
 *             value: 22AAAAA0000A1Z5
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxIdentityResponse'
 *       409:
 *         description: Already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/tax-identity",
  validation.createTaxIdentityValidation,
  asyncHandler(controller.createTaxIdentity)
);

/**
 * @swagger
 * /api/seller-onboarding/tax-identity:
 *   get:
 *     summary: Get tax identities
 *     description: List tax identities for the user.
 *     tags: [Seller Onboarding]
 *     operationId: getTaxIdentities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxIdentityListResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/tax-identity", asyncHandler(controller.getTaxIdentitiesByUserId));

/**
 * @swagger
 * /api/seller-onboarding/bank-details:
 *   post:
 *     summary: Add bank details
 *     description: Add bank info for onboarding.
 *     tags: [Seller Onboarding]
 *     operationId: createBankDetails
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BankDetailsCreateRequest'
 *           example:
 *             accountNumber: "1234567890"
 *             ifscCode: "SBIN0001234"
 *             accountHolderName: "John Doe"
 *             bankName: "State Bank of India"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankDetailsResponse'
 *       409:
 *         description: Already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/bank-details",
  validation.createBankDetailsValidation,
  asyncHandler(controller.createBankDetails)
);

/**
 * @swagger
 * /api/seller-onboarding/bank-details:
 *   get:
 *     summary: Get bank details
 *     description: Get bank info for the user.
 *     tags: [Seller Onboarding]
 *     operationId: getBankDetails
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankDetailsResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/bank-details",
  asyncHandler(controller.getBankDetailsByOnboardingId)
);

/**
 * @swagger
 * /api/seller-onboarding/bank-details:
 *   put:
 *     summary: Update bank details (authenticated)
 *     description: Update existing bank details for the authenticated seller. Only allowed when onboarding is completed.
 *     tags: [Seller Onboarding]
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
 *               - ifscCode
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 description: Bank account number
 *                 example: "1234567890"
 *               ifscCode:
 *                 type: string
 *                 description: IFSC code of the bank
 *                 example: "SBIN0001234"
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     accountNumber:
 *                       type: string
 *                       example: "1234567890"
 *                     ifscCode:
 *                       type: string
 *                       example: "SBIN0001234"
 *                     sellerOnboardingId:
 *                       type: integer
 *                       example: 1
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Seller onboarding or bank details not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Bank details not found. Please create bank details first."
 *               error: NOT_FOUND
 *       409:
 *         description: Onboarding not completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Bank details can only be updated when onboarding is completed"
 *               error: CONFLICT
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/bank-details",
  validation.updateBankDetailsValidation,
  asyncHandler(controller.updateBankDetails)
);

/**
 * @swagger
 * /api/seller-onboarding/store:
 *   post:
 *     summary: Create store
 *     description: Create a store for the onboarding user.
 *     tags: [Seller Onboarding]
 *     operationId: createStore
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreCreateRequest'
 *           example:
 *             name: My Electronics Store
 *             ownerFullName: John Doe
 *             signatureS3Key: signatures/johndoe.png
 *             email: store@example.com
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreResponse'
 *       409:
 *         description: Already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/store",
  validation.createStoreValidation,
  asyncHandler(controller.createStore)
);

/**
 * @swagger
 * /api/seller-onboarding/address:
 *   post:
 *     summary: Add store address
 *     description: Add address for the store.
 *     tags: [Seller Onboarding]
 *     operationId: createAddress
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressCreateRequest'
 *           example:
 *             buildingNumber: "123"
 *             street: Main Street
 *             landmark: Near City Center
 *             pincode: "400001"
 *             city: Mumbai
 *             state: Maharashtra
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddressResponse'
 *       409:
 *         description: Already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/address",
  validation.createAddressValidation,
  asyncHandler(controller.createAddress)
);

/**
 * @swagger
 * /api/seller-onboarding/address:
 *   get:
 *     summary: Get store address
 *     description: Get address for the user's store.
 *     tags: [Seller Onboarding]
 *     operationId: getAddress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddressResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/address", asyncHandler(controller.getAddressByUserId));

/**
 * @swagger
 * /api/seller-onboarding/presigned-url:
 *   post:
 *     summary: Get presigned S3 URL
 *     description: Generate a presigned URL for file upload.
 *     tags: [Seller Onboarding]
 *     operationId: generatePresignedUrl
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PresignedUrlRequest'
 *           example:
 *             fileName: digital_signature.jpg
 *             contentType: image/jpeg
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresignedUrlResponse'
 *             example:
 *               success: true
 *               message: Presigned URL generated
 *               data:
 *                 presignedUrl: https://s3.amazonaws.com/bucket/file?signature=...
 *                 s3Key: e-signatures/user1_signature.jpg
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/presigned-url",
  validation.generatePresignedUrlValidation,
  asyncHandler(controller.generatePresignedUrl)
);

/**
 * @swagger
 * /api/seller-onboarding/business-type:
 *   put:
 *     summary: Update business type
 *     description: Update the business type for the authenticated user's seller onboarding.
 *     tags: [Seller Onboarding]
 *     operationId: updateBusinessType
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessType
 *             properties:
 *               businessType:
 *                 type: string
 *                 enum: [MANUFACTURER, RETAILER, WHOLESALER, RESELLER]
 *                 description: The business type to set
 *           example:
 *             businessType: RETAILER
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     businessType:
 *                       type: string
 *             example:
 *               success: true
 *               message: Business type updated successfully
 *               data:
 *                 businessType: RETAILER
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: Seller onboarding not found
 *               error: NOT_FOUND
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/business-type",
  validation.updateBusinessTypeValidation,
  asyncHandler(controller.updateBusinessType)
);

/**
 * @swagger
 * /api/seller-onboarding/progress:
 *   get:
 *     summary: Get seller progress
 *     description: Get the 3-step journey progress for the authenticated seller.
 *     tags: [Seller Onboarding]
 *     operationId: getSellerProgress
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
 *                   type: object
 *                   properties:
 *                     steps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           completed:
 *                             type: boolean
 *             example:
 *               success: true
 *               data:
 *                 steps:
 *                   - name: "Upload Catalog"
 *                     completed: true
 *                   - name: "Catalogs Go Live"
 *                     completed: false
 *                   - name: "Get First Order"
 *                     completed: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/progress", asyncHandler(controller.getSellerProgress));

/**
 * @swagger
 * /api/seller-onboarding/pickup-location:
 *   post:
 *     summary: Add pickup location to Shiprocket
 *     description: Creates a pickup location in Shiprocket using seller onboarding data (store, address, location, user, tax identity).
 *     tags: [Seller Onboarding]
 *     operationId: addPickupLocation
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     address:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: integer
 *                         pickup_code:
 *                           type: string
 *                         address:
 *                           type: string
 *                         city:
 *                           type: string
 *                         state:
 *                           type: string
 *                         country:
 *                           type: string
 *                         pin_code:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         id:
 *                           type: integer
 *                     pickup_id:
 *                       type: integer
 *                     company_name:
 *                       type: string
 *                     full_name:
 *                       type: string
 *             example:
 *               success: true
 *               message: Pickup location added to Shiprocket successfully
 *               data:
 *                 success: true
 *                 address:
 *                   company_id: 25149
 *                   pickup_code: "TESTADI"
 *                   address: "Mutant Facility, Sector 3"
 *                   city: "South West Delhi"
 *                   state: "Maharashtra"
 *                   country: "India"
 *                   pin_code: "110022"
 *                   phone: "9777777779"
 *                   email: "deadpool@chimichanga.com"
 *                   name: "Deadpool"
 *                   id: 1856901
 *                 pickup_id: 1856901
 *                 company_name: "ShiprocketTest"
 *                 full_name: "API"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: Seller onboarding not found
 *               error: NOT_FOUND
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: User mobile number is required
 *               error: VALIDATION_ERROR
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/pickup-location",
  validation.addPickupLocationValidation,
  asyncHandler(controller.addPickupLocation)
);



/**
 * @swagger
 * /api/seller-onboarding/seller/{id}:
 *   get:
 *     summary: Get complete seller details for admin
 *     tags: [Seller Onboarding]
 *     security:
 *       - bearerAuth: []
 */

router.get(
  "/seller/:id",
  asyncHandler(controller.getAdminSellerDetails)
);

module.exports = router;
