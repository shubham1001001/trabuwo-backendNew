const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");
const { requireRole } = require("../../middleware/auth");

// Apply authentication to all routes
router.use(authenticate);

// ClaimCategory routes
/**
 * @swagger
 * /api/claim/categories:
 *   post:
 *     summary: Create a new claim category
 *     tags: [ClaimCategory]
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the claim category
 *                 example: "Delivery Issues"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the claim category is active
 *     responses:
 *       201:
 *         description: Claim category created successfully
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
  "/categories",
  validation.createClaimCategoryValidation,
  asyncHandler(controller.createClaimCategory)
);

/**
 * @swagger
 * /api/claim/categories:
 *   get:
 *     summary: Get all claim categories
 *     tags: [ClaimCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include inactive categories
 *     responses:
 *       200:
 *         description: Claim categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/categories", asyncHandler(controller.getAllClaimCategories));

/**
 * @swagger
 * /api/claim/categories-with-types:
 *   get:
 *     summary: Get all claim categories with their claim types
 *     tags: [ClaimCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include inactive categories and types
 *     responses:
 *       200:
 *         description: Claim categories with types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data: [
 *                 {
 *                   id: 1,
 *                   name: "Delivery Issues",
 *                   isActive: true,
 *                   createdAt: "2024-01-15T10:30:00.000Z",
 *                   claimTypes: [
 *                     {
 *                       id: "123e4567-e89b-12d3-a456-426614174000",
 *                       name: "Wrong Return Received",
 *                       description: "Customer received wrong product in return package",
 *                       isActive: true
 *                     },
 *                     {
 *                       id: "456e7890-e89b-12d3-a456-426614174000",
 *                       name: "Package Damaged",
 *                       description: "Package arrived in damaged condition",
 *                       isActive: true
 *                     }
 *                   ]
 *                 }
 *               ]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/categories-with-types",
  asyncHandler(controller.getAllClaimCategoriesWithTypes)
);

/**
 * @swagger
 * /api/claim/categories/{id}:
 *   get:
 *     summary: Get claim category by ID
 *     tags: [ClaimCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Claim category ID
 *     responses:
 *       200:
 *         description: Claim category retrieved successfully
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
  "/categories/:id",
  validation.getClaimCategoryByIdValidation,
  asyncHandler(controller.getClaimCategoryById)
);

/**
 * @swagger
 * /api/claim/categories/{id}:
 *   put:
 *     summary: Update claim category
 *     tags: [ClaimCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Claim category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the claim category
 *                 example: "Updated Delivery Issues"
 *               isActive:
 *                 type: boolean
 *                 description: Whether the claim category is active
 *     responses:
 *       200:
 *         description: Claim category updated successfully
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
  "/categories/:id",
  validation.updateClaimCategoryValidation,
  asyncHandler(controller.updateClaimCategoryById)
);

/**
 * @swagger
 * /api/claim/categories/{id}:
 *   delete:
 *     summary: Delete claim category
 *     tags: [ClaimCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Claim category ID
 *     responses:
 *       200:
 *         description: Claim category deleted successfully
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
  "/categories/:id",
  validation.deleteClaimCategoryValidation,
  asyncHandler(controller.softDeleteClaimCategoryById)
);

// ClaimType routes
/**
 * @swagger
 * /api/claim/types:
 *   post:
 *     summary: Create a new claim type
 *     tags: [ClaimType]
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
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the claim type
 *                 example: "Wrong Return Received"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Description of the claim type
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the claim category
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the claim type is active
 *     responses:
 *       201:
 *         description: Claim type created successfully
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
  "/types",
  validation.createClaimTypeValidation,
  asyncHandler(controller.createClaimType)
);

/**
 * @swagger
 * /api/claim/my-claims:
 *   get:
 *     summary: Get user's claims with pagination
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ${JSON.stringify(CLAIM_STATUSES)}
 *         description: Filter by status
 *       - in: query
 *         name: claimTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by claim type ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: ${JSON.stringify(CLAIM_PRIORITIES)}
 *         description: Filter by priority
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Claims retrieved successfully
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
 *                   example: "Claims retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     claims:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Claim'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalCount:
 *                           type: integer
 *                           description: Total number of claims
 *                         totalPages:
 *                           type: integer
 *                           description: Total number of pages
 *                         currentPage:
 *                           type: integer
 *                           description: Current page number
 *                         limit:
 *                           type: integer
 *                           description: Number of items per page
 *                         hasNextPage:
 *                           type: boolean
 *                           description: Whether there is a next page
 *                         hasPreviousPage:
 *                           type: boolean
 *                           description: Whether there is a previous page
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/my-claims",
  validation.getClaimsByUserIdValidation,
  asyncHandler(controller.getClaimsByUserId)
);

/**
 * @swagger
 * /api/claim/types:
 *   get:
 *     summary: Get all claim types
 *     tags: [ClaimType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive claim types
 *     responses:
 *       200:
 *         description: Claim types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/types", asyncHandler(controller.getAllClaimTypes));

/**
 * @swagger
 * /api/claim/types/{id}:
 *   get:
 *     summary: Get claim type by ID
 *     tags: [ClaimType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Claim type ID
 *     responses:
 *       200:
 *         description: Claim type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/types/:id",
  validation.getClaimTypeByIdValidation,
  asyncHandler(controller.getClaimTypeById)
);

/**
 * @swagger
 * /api/claim/types/{id}:
 *   put:
 *     summary: Update claim type
 *     tags: [ClaimType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Claim type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the claim type
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Description of the claim type
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the claim category
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Whether the claim type is active
 *     responses:
 *       200:
 *         description: Claim type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/types/:id",
  validation.updateClaimTypeValidation,
  asyncHandler(controller.updateClaimTypeById)
);

/**
 * @swagger
 * /api/claim/types/{id}:
 *   delete:
 *     summary: Delete claim type
 *     tags: [ClaimType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Claim type ID
 *     responses:
 *       200:
 *         description: Claim type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/types/:id",
  validation.deleteClaimTypeValidation,
  asyncHandler(controller.softDeleteClaimTypeById)
);

/**
 * @swagger
 * /api/claim/categories/{categoryId}/types:
 *   get:
 *     summary: Get claim types by category ID
 *     tags: [ClaimType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Category ID
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include inactive claim types
 *     responses:
 *       200:
 *         description: Claim types retrieved successfully
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
  "/categories/:categoryId/types",
  asyncHandler(controller.getClaimTypesByCategoryId)
);

// Claim routes
/**
 * @swagger
 * /api/claim/create:
 *   post:
 *     summary: Create a new claim/ticket
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - claimTypeId
 *               - orderId
 *               - awbNumber
 *               - packetId
 *               - issueType
 *               - evidence
 *             properties:
 *               claimTypeId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the claim type
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               orderId:
 *                 type: string
 *                 maxLength: 100
 *                 description: Sub Order Number
 *                 example: "ORD123456789"
 *               awbNumber:
 *                 type: string
 *                 maxLength: 100
 *                 description: AWB Number
 *                 example: "AWB987654321"
 *               packetId:
 *                 type: string
 *                 maxLength: 100
 *                 description: Packet ID or 'NA' if not available
 *                 example: "PKT123456"
 *               issueType:
 *                 type: string
 *                 maxLength: 500
 *                 description: Specific issue description
 *                 example: "Received wrong product in return package"
 *               stateOfPacket:
 *                 type: string
 *                 enum: ${JSON.stringify(PACKET_STATES)}
 *                 description: State of the packet
 *                 example: "intact"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Additional description
 *                 example: "The return package contained a different product than expected"
 *               callbackNumber:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15
 *                 description: Callback phone number
 *                 example: "+91 8769087650"
 *               evidence:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of evidence objects (S3 file info)
 *                 items:
 *                   type: object
 *                   required:
 *                     - evidenceType
 *                     - fileKey
 *                     - fileUrl
 *                     - fileName
 *                     - fileSize
 *                     - mimeType
 *                   properties:
 *                     evidenceType:
 *                       type: string
 *                       enum: ${JSON.stringify(EVIDENCE_TYPES)}
 *                       example: "unpacking_video"
 *                     fileKey:
 *                       type: string
 *                       example: "claims/claimId/unpacking_video/uuid-filename.mp4"
 *                     fileUrl:
 *                       type: string
 *                       format: uri
 *                       example: "https://s3.amazonaws.com/bucket/claims/claimId/unpacking_video/uuid-filename.mp4"
 *                     fileName:
 *                       type: string
 *                       example: "unboxing.mp4"
 *                     fileSize:
 *                       type: integer
 *                       example: 1234567
 *                     mimeType:
 *                       type: string
 *                       example: "video/mp4"
 *     responses:
 *       201:
 *         description: Claim created successfully
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
  "/create",
  validation.createClaimValidation,
  asyncHandler(controller.createClaim)
);

/**
 * @swagger
 * /api/claim/presigned-url:
 *   post:
 *     summary: Generate presigned URL for file upload
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - contentType
 *             properties:
 *               fileName:
 *                 type: string
 *                 maxLength: 255
 *                 description: Name of the file to upload
 *                 example: "unboxing.mp4"
 *               contentType:
 *                 type: string
 *                 maxLength: 100
 *                 description: MIME type of the file
 *                 example: "video/mp4"
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
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
  "/presigned-url",
  validation.generatePresignedUrlValidation,
  asyncHandler(controller.generatePresignedUrl)
);

/**
 * @swagger
 * /api/claim/{id}:
 *   get:
 *     summary: Get claim by ID
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Claim ID
 *     responses:
 *       200:
 *         description: Claim retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/:id",
  validation.getClaimByIdValidation,
  asyncHandler(controller.getClaimById)
);

/**
 * @swagger
 * /api/claim/admin/all:
 *   get:
 *     summary: Get all claims (admin only)
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ${JSON.stringify(CLAIM_STATUSES)}
 *         description: Filter by status
 *       - in: query
 *         name: claimTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by claim type ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: Claims retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/admin/all",
  requireRole("admin"),
  validation.getAllClaimsValidation,
  asyncHandler(controller.getAllClaims)
);

/**
 * @swagger
 * /api/claim/{id}:
 *   put:
 *     summary: Update claim
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Claim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               claimTypeId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the claim type
 *               orderId:
 *                 type: string
 *                 maxLength: 100
 *                 description: Sub Order Number
 *               awbNumber:
 *                 type: string
 *                 maxLength: 100
 *                 description: AWB Number
 *               packetId:
 *                 type: string
 *                 maxLength: 100
 *                 description: Packet ID
 *               issueType:
 *                 type: string
 *                 maxLength: 500
 *                 description: Specific issue description
 *               stateOfPacket:
 *                 type: string
 *                 enum: ${JSON.stringify(PACKET_STATES)}
 *                 description: State of the packet
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Additional description
 *               status:
 *                 type: string
 *                 enum: ${JSON.stringify(CLAIM_STATUSES)}
 *                 description: Claim status
 *               priority:
 *                 type: string
 *                 enum: ${JSON.stringify(CLAIM_PRIORITIES)}
 *                 description: Claim priority
 *               callbackNumber:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15
 *                 description: Callback phone number
 *     responses:
 *       200:
 *         description: Claim updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/:id",
  validation.updateClaimValidation,
  asyncHandler(controller.updateClaimById)
);

/**
 * @swagger
 * /api/claim/{id}:
 *   delete:
 *     summary: Delete claim
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Claim ID
 *     responses:
 *       200:
 *         description: Claim deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/:id",
  validation.deleteClaimValidation,
  asyncHandler(controller.softDeleteClaimById)
);

/**
 * @swagger
 * /api/claim/statistics:
 *   get:
 *     summary: Get claim statistics
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Claim statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data: {
 *                 total: 150,
 *                 open: 45,
 *                 inProgress: 30,
 *                 resolved: 60,
 *                 closed: 15
 *               }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/statistics", asyncHandler(controller.getClaimStatistics));

/**
 * @swagger
 * /api/claim/{id}/response:
 *   post:
 *     summary: Add response to claim
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Claim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responseType
 *               - message
 *             properties:
 *               responseType:
 *                 type: string
 *                 enum: ${JSON.stringify(RESPONSE_TYPES)}
 *                 description: Type of response
 *                 example: "user_update"
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Response message
 *                 example: "I have provided additional information as requested"
 *               internalNotes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Internal notes (admin only)
 *     responses:
 *       200:
 *         description: Response added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
  "/:id/response",
  validation.addClaimResponseValidation,
  asyncHandler(controller.addClaimResponse)
);

/**
 * @swagger
 * /api/claim/{id}/evidence:
 *   post:
 *     summary: Attach evidence files to claim (S3 URLs)
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Claim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - evidence
 *             properties:
 *               evidence:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of evidence objects (S3 file info)
 *                 items:
 *                   type: object
 *                   required:
 *                     - evidenceType
 *                     - fileKey
 *                     - fileUrl
 *                     - fileName
 *                     - fileSize
 *                     - mimeType
 *                   properties:
 *                     evidenceType:
 *                       type: string
 *                       enum: ${JSON.stringify(EVIDENCE_TYPES)}
 *                       example: "product_image"
 *                     fileKey:
 *                       type: string
 *                       example: "claims/claimId/product_image/uuid-filename.jpg"
 *                     fileUrl:
 *                       type: string
 *                       format: uri
 *                       example: "https://s3.amazonaws.com/bucket/claims/claimId/product_image/uuid-filename.jpg"
 *                     fileName:
 *                       type: string
 *                       example: "product.jpg"
 *                     fileSize:
 *                       type: integer
 *                       example: 234567
 *                     mimeType:
 *                       type: string
 *                       example: "image/jpeg"
 *     responses:
 *       200:
 *         description: Evidence uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
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
  "/:id/evidence",
  validation.uploadClaimEvidenceValidation,
  asyncHandler(controller.uploadClaimEvidence)
);

/**
 * @swagger
 * /api/claim/evidence/{evidenceId}:
 *   delete:
 *     summary: Delete claim evidence
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: evidenceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Evidence ID
 *     responses:
 *       200:
 *         description: Evidence deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/evidence/:evidenceId",
  validation.deleteClaimEvidenceValidation,
  asyncHandler(controller.deleteClaimEvidence)
);

/**
 * @swagger
 * /api/claim/admin/stats:
 *   get:
 *     summary: Get claim statistics (admin only)
 *     tags: [Claim]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Claim statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/admin/stats",
  requireRole("admin"),
  asyncHandler(controller.getClaimStats)
);

module.exports = router;
