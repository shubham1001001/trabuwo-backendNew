const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate, requireRole } = require("../../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     BarcodePackagingVendor:
 *       type: object
 *       required:
 *         - name
 *         - location
 *         - imgS3Key
 *         - pricePerPacket
 *         - redirectUrl
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated vendor ID
 *         publicId:
 *           type: string
 *           format: uuid
 *           description: Public UUID for client-facing operations
 *         name:
 *           type: string
 *           description: Vendor name
 *         location:
 *           type: string
 *           description: Vendor location
 *         imgS3Key:
 *           type: string
 *           description: S3 key for vendor image
 *         pricePerPacket:
 *           type: number
 *           format: decimal
 *           description: Price per packet
 *         redirectUrl:
 *           type: string
 *           format: uri
 *           description: Redirect URL for vendor
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PresignedUrlRequest:
 *       type: object
 *       required:
 *         - key
 *         - contentType
 *       properties:
 *         key:
 *           type: string
 *           description: File key/name
 *         contentType:
 *           type: string
 *           description: MIME type of the file
 *     PresignedUrlResponse:
 *       type: object
 *       properties:
 *         presignedUrl:
 *           type: string
 *           description: Presigned URL for upload
 *         key:
 *           type: string
 *           description: S3 key
 *         url:
 *           type: string
 *           description: Public URL
 *         bucket:
 *           type: string
 *           description: S3 bucket name
 */

/**
 * @swagger
 * /api/barcode-packaging/vendors:
 *   get:
 *     summary: Get all barcode packaging vendors (Public)
 *     tags: [BarcodePackaging]
 *     responses:
 *       200:
 *         description: List of vendors retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BarcodePackagingVendor'
 *   post:
 *     summary: Create a new barcode packaging vendor (Admin only)
 *     tags: [BarcodePackaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BarcodePackagingVendor'
 *     responses:
 *       201:
 *         description: Vendor created successfully
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
 *                   $ref: '#/components/schemas/BarcodePackagingVendor'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get("/vendors", controller.listVendors);
router.post(
  "/vendors",
  authenticate,
  requireRole("admin"),
  validation.createVendorValidation,
  controller.createVendor
);

/**
 * @swagger
 * /api/barcode-packaging/vendors/{publicId}:
 *   get:
 *     summary: Get barcode packaging vendor by public ID (Public)
 *     tags: [BarcodePackaging]
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vendor public ID
 *     responses:
 *       200:
 *         description: Vendor retrieved successfully
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
 *                   $ref: '#/components/schemas/BarcodePackagingVendor'
 *       404:
 *         description: Vendor not found
 *       400:
 *         description: Validation error
 * /api/barcode-packaging/vendors/{id}:
 *   put:
 *     summary: Update barcode packaging vendor by ID (Admin only)
 *     tags: [BarcodePackaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               imgS3Key:
 *                 type: string
 *               pricePerPacket:
 *                 type: number
 *                 format: decimal
 *               redirectUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Vendor updated successfully
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
 *                   $ref: '#/components/schemas/BarcodePackagingVendor'
 *       404:
 *         description: Vendor not found
 *       400:
 *         description: Validation error
 *   delete:
 *     summary: Delete barcode packaging vendor by ID (Admin only)
 *     tags: [BarcodePackaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor deleted successfully
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
 *                     message:
 *                       type: string
 *       404:
 *         description: Vendor not found
 *       400:
 *         description: Validation error
 */
router.get(
  "/vendors/:publicId",
  validation.getVendorByPublicIdValidation,
  controller.getVendorByPublicId
);
router.patch(
  "/vendors/:id",
  authenticate,
  requireRole("admin"),
  validation.updateVendorValidation,
  controller.updateVendorById
);
router.delete(
  "/vendors/:id",
  authenticate,
  requireRole("admin"),
  validation.deleteVendorValidation,
  controller.deleteVendorById
);

/**
 * @swagger
 * /api/barcode-packaging/uploads/presigned-url:
 *   post:
 *     summary: Generate presigned URL for image upload (Admin only)
 *     tags: [BarcodePackaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PresignedUrlRequest'
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
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
 *                   $ref: '#/components/schemas/PresignedUrlResponse'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post(
  "/uploads/presigned-url",
  authenticate,
  requireRole("admin"),
  validation.presignedUrlValidation,
  controller.generatePresignedUrlForImage
);

module.exports = router;
