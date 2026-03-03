const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/image-bulk-upload/generate-urls:
 *   post:
 *     summary: Generate presigned URLs for bulk image upload
 *     description: Generate presigned URLs for up to 10 images for bulk upload to product_images folder
 *     tags: [Image Bulk Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 10
 *                 description: Array of image metadata objects
 *                 items:
 *                   type: object
 *                   required:
 *                     - fileName
 *                     - contentType
 *                     - fileSize
 *                   properties:
 *                     fileName:
 *                       type: string
 *                       description: Original file name with extension
 *                       example: "product1.jpg"
 *                       minLength: 1
 *                       maxLength: 255
 *                     contentType:
 *                       type: string
 *                       description: MIME type of the image
 *                       example: "image/jpeg"
 *                       pattern: "^image/(jpeg|jpg|png|gif|webp)$"
 *                     fileSize:
 *                       type: integer
 *                       description: File size in bytes
 *                       example: 1024000
 *                       minimum: 1
 *                       maximum: 10485760
 *     responses:
 *       200:
 *         description: Presigned URLs generated successfully
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
 *                   example: "Bulk upload URLs generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       description: Array of generated presigned URLs and metadata
 *                       items:
 *                         type: object
 *                         properties:
 *                           fileName:
 *                             type: string
 *                             description: Original file name
 *                             example: "product1.jpg"
 *                           presignedUrl:
 *                             type: string
 *                             description: Presigned URL for S3 upload
 *                             example: "https://..."
 *                           key:
 *                             type: string
 *                             description: S3 object key
 *                             example: "product_images/user123/1234567890-abc123.jpg"
 *                           url:
 *                             type: string
 *                             description: Public S3 URL after upload
 *                             example: "https://bucket.s3.region.amazonaws.com/..."
 *                           bucket:
 *                             type: string
 *                             description: S3 bucket name
 *                             example: "my-bucket"
 *                           status:
 *                             type: string
 *                             description: Status of URL generation
 *                             example: "success"
 *                           error:
 *                             type: string
 *                             description: Error message if generation failed
 *                             example: "Invalid content type"
 *                     totalImages:
 *                       type: integer
 *                       description: Total number of images requested
 *                       example: 5
 *                     successfulImages:
 *                       type: integer
 *                       description: Number of successfully generated URLs
 *                       example: 4
 *                     failedImages:
 *                       type: integer
 *                       description: Number of failed URL generations
 *                       example: 1
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the presigned URLs expire
 *                       example: "2024-01-15T11:30:00.000Z"
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
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "images"
 *                       message:
 *                         type: string
 *                         example: "Images must be an array with 1-10 items"
 *       401:
 *         description: Unauthorized - authentication required
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
 *                   example: "Authentication required"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
router.post(
  "/generate-urls",
  validation.validateBulkUploadImages,
  asyncHandler(controller.generateBulkUploadUrls)
);

module.exports = router;
