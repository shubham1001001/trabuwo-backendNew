const express = require("express");
const router = express.Router();
const noticeBoardController = require("./controller");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");
const {
  createNoticeValidation,
  updateNoticeValidation,
  getNoticesValidation,
  getNoticeByIdValidation,
  deleteNoticeValidation,
  toggleStatusValidation,
  generatePresignedUrlValidation,
  deleteImageValidation,
} = require("./validation");

router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     NoticeBoard:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - imageUrl
 *         - s3Key
 *         - date
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the notice
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Title of the notice
 *         description:
 *           type: string
 *           description: Detailed description of the notice
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: Public URL of the notice image
 *         s3Key:
 *           type: string
 *           description: S3 object key for the image
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the notice (YYYY-MM-DD)
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the notice is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     NoticeBoardCreate:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - imageUrl
 *         - s3Key
 *         - date
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 255
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *           format: uri
 *         s3Key:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         isActive:
 *           type: boolean
 *           default: true
 *
 *     NoticeBoardUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 255
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *           format: uri
 *         s3Key:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         isActive:
 *           type: boolean
 *
 *     PaginatedNotices:
 *       type: object
 *       properties:
 *         notices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NoticeBoard'
 *         pagination:
 *           type: object
 *           properties:
 *             current_page:
 *               type: integer
 *             total_pages:
 *               type: integer
 *             total_count:
 *               type: integer
 *             limit:
 *               type: integer
 *
 *     PresignedUrlResponse:
 *       type: object
 *       properties:
 *         presignedUrl:
 *           type: string
 *           description: Presigned URL for uploading to S3
 *         key:
 *           type: string
 *           description: S3 object key
 *         url:
 *           type: string
 *           description: Public URL of the uploaded file
 *         bucket:
 *           type: string
 *           description: S3 bucket name
 */

/**
 * @swagger
 * /api/notice-board:
 *   post:
 *     summary: Create a new notice
 *     tags: [Notice Board]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoticeBoardCreate'
 *     responses:
 *       201:
 *         description: Notice created successfully
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
 *                   $ref: '#/components/schemas/NoticeBoard'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  createNoticeValidation,
  asyncHandler(noticeBoardController.createNotice)
);

/**
 * @swagger
 * /api/notice-board:
 *   get:
 *     summary: Get all notices with pagination
 *     tags: [Notice Board]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Notices retrieved successfully
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
 *                   $ref: '#/components/schemas/PaginatedNotices'
 */
router.get(
  "/",
  getNoticesValidation,
  asyncHandler(noticeBoardController.getAllNotices)
);

/**
 * @swagger
 * /api/notice-board/presigned-url:
 *   post:
 *     summary: Generate presigned URL for S3 upload
 *     tags: [Notice Board]
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
 *                 description: Original file name
 *               contentType:
 *                 type: string
 *                 description: MIME type of the file
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
 */
router.post(
  "/presigned-url",
  generatePresignedUrlValidation,
  asyncHandler(noticeBoardController.generatePresignedUrl)
);

/**
 * @swagger
 * /api/notice-board/delete-image:
 *   delete:
 *     summary: Delete an image from S3
 *     tags: [Notice Board]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - s3Key
 *             properties:
 *               s3Key:
 *                 type: string
 *                 description: S3 object key to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
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
 *                     key:
 *                       type: string
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/delete-image",
  deleteImageValidation,
  asyncHandler(noticeBoardController.deleteImage)
);

/**
 * @swagger
 * /api/notice-board/{id}:
 *   get:
 *     summary: Get a specific notice by ID
 *     tags: [Notice Board]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notice ID
 *     responses:
 *       200:
 *         description: Notice retrieved successfully
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
 *                   $ref: '#/components/schemas/NoticeBoard'
 *       404:
 *         description: Notice not found
 */
router.get(
  "/:id",
  getNoticeByIdValidation,
  asyncHandler(noticeBoardController.getNoticeById)
);

/**
 * @swagger
 * /api/notice-board/{id}:
 *   put:
 *     summary: Update a notice
 *     tags: [Notice Board]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoticeBoardUpdate'
 *     responses:
 *       200:
 *         description: Notice updated successfully
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
 *                   $ref: '#/components/schemas/NoticeBoard'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Notice not found
 */
router.put(
  "/:id",
  updateNoticeValidation,
  asyncHandler(noticeBoardController.updateNotice)
);

/**
 * @swagger
 * /api/notice-board/{id}/toggle-status:
 *   patch:
 *     summary: Toggle notice active status
 *     tags: [Notice Board]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notice ID
 *     responses:
 *       200:
 *         description: Notice status toggled successfully
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
 *                   $ref: '#/components/schemas/NoticeBoard'
 *       404:
 *         description: Notice not found
 */
router.patch(
  "/:id/toggle-status",
  toggleStatusValidation,
  asyncHandler(noticeBoardController.toggleNoticeStatus)
);

/**
 * @swagger
 * /api/notice-board/{id}:
 *   delete:
 *     summary: Delete a notice
 *     tags: [Notice Board]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notice ID
 *     responses:
 *       200:
 *         description: Notice deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Notice not found
 */
router.delete(
  "/:id",
  deleteNoticeValidation,
  asyncHandler(noticeBoardController.deleteNotice)
);

module.exports = router;
