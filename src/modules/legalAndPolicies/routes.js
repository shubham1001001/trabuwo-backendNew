const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate, requireRole } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: LegalAndPolicies
 *   description: Legal policies and user agreements
 */

/**
 * @swagger
 * /api/legal-and-policies/policies/active:
 *   get:
 *     summary: Get all active policies and their content
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active policies fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/policies/active", asyncHandler(controller.getActivePolicies));

/**
 * @swagger
 * /api/legal-and-policies/policies:
 *   post:
 *     summary: Create a new policy definition
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *               - displayName
 *               - policyTypeCode
 *             properties:
 *               slug:
 *                 type: string
 *               displayName:
 *                 type: string
 *               policyTypeCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Policy created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  "/policies",
  requireRole("admin"),
  validation.createPolicyValidation,
  asyncHandler(controller.createPolicy),
);

/**
 * @swagger
 * /api/legal-and-policies/policies:
 *   get:
 *     summary: List policies with their active versions
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Policies fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  "/policies",
  requireRole("admin"),
  validation.listPoliciesValidation,
  asyncHandler(controller.listPolicies),
);








/**
 * @swagger
 * /api/legal-and-policies/policies/active-by-type:
 *   get:
 *     summary: Get active policy content by policy type (Buyer App)
 *     description: Fetch the active policy along with its latest version content using policy type code (e.g., privacy_policy, terms_of_service)
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           example: privacy_policy
 *         description: Policy type code (from policy-types API)
 *     responses:
 *       200:
 *         description: Active policy fetched successfully
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
 *                   example: Active policy fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     slug:
 *                       type: string
 *                       example: privacy-policy
 *                     displayName:
 *                       type: string
 *                       example: Privacy Policy
 *                     policyType:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 2
 *                         code:
 *                           type: string
 *                           example: privacy_policy
 *                         displayName:
 *                           type: string
 *                           example: Privacy Policy
 *                     version:
 *                       type: object
 *                       properties:
 *                         versionNumber:
 *                           type: integer
 *                           example: 1
 *                         contentMarkdown:
 *                           type: string
 *                           example: "# Privacy Policy\nYour data is safe..."
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: 2026-03-01T10:00:00Z
 *       400:
 *         description: Policy type is required
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No active policy found for this type
 */

router.get(
  "/policies/active-by-type",
  asyncHandler(controller.getActivePolicyByType)
);




/**
 * @swagger
 * /api/legal-and-policies/policies/{publicId}:
 *   get:
 *     summary: Get a policy and its versions
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Policy details fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/policies/:publicId",
  requireRole("admin"),
  validation.getPolicyValidation,
  asyncHandler(controller.getPolicyByPublicId),
);

/**
 * @swagger
 * /api/legal-and-policies/policies/{publicId}:
 *   put:
 *     summary: Update a policy
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               policyTypeCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Policy updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  "/policies/:publicId",
  requireRole("admin"),
  validation.updatePolicyValidation,
  asyncHandler(controller.updatePolicy),
);

/**
 * @swagger
 * /api/legal-and-policies/policies/{publicId}/versions:
 *   post:
 *     summary: Create a new policy version
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentMarkdown
 *             properties:
 *               contentMarkdown:
 *                 type: string
 *               makeActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Policy version created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/policies/:publicId/versions",
  requireRole("admin"),
  validation.createPolicyVersionValidation,
  asyncHandler(controller.createPolicyVersion),
);

/**
 * @swagger
 * /api/legal-and-policies/agreements:
 *   post:
 *     summary: Record user agreement for a policy version
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - versionPublicId
 *             properties:
 *               versionPublicId:
 *                 type: string
 *                 format: uuid
 *               ipAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: User agreement recorded successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/agreements",
  validation.recordUserAgreementValidation,
  asyncHandler(controller.recordUserAgreement),
);

/**
 * @swagger
 * /api/legal-and-policies/agreements:
 *   get:
 *     summary: List current user's policy agreements
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: User agreements fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  "/agreements",
  validation.listUserAgreementsValidation,
  asyncHandler(controller.listUserAgreements),
);


/**
 * @swagger
 * /api/legal-and-policies/policy-types:
 *   get:
 *     summary: Get all active policy types (Buyer App)
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Policy types fetched successfully
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
 *                       code:
 *                         type: string
 *                       displayName:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  "/policy-types",
  asyncHandler(controller.getPolicyTypes)
);



/**
 * @swagger
 * /api/legal-and-policies/policies/active:
 *   get:
 *     summary: Get all active policies with latest version (Buyer App)
 *     tags: [LegalAndPolicies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active policies fetched successfully
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
 *                     policies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           slug:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           policyType:
 *                             type: object
 *                           version:
 *                             type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  "/policies/active",
  asyncHandler(controller.getActivePolicies)
);












module.exports = router;
