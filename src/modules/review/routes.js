const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /api/review/create:
 *   post:
 *     summary: Create a new review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderItemId
 *               - rating
 *             properties:
 *               orderItemId:
 *                 type: string
 *                 format: uuid
 *                 description: Order item ID (must be purchased by user)
 *                 example: "123e4567-e89b-12d3-a456-426614174001"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *                 example: 5
 *               title:
 *                 type: string
 *                 maxLength: 120
 *                 description: Review title (optional)
 *                 example: "Great product!"
 *               text:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Review text content (optional)
 *                 example: "This product exceeded my expectations..."
 *               images:
 *                 type: array
 *                 description: Review images (optional)
 *                 items:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       description: Image URL
 *                       example: "https://example.com/image.jpg"
 *                     imageKey:
 *                       type: string
 *                       description: S3 key or file path
 *                       example: "reviews/user123/image1.jpg"
 *                     altText:
 *                       type: string
 *                       description: Alt text for accessibility
 *                       example: "Product in use"
 *                     sortOrder:
 *                       type: integer
 *                       minimum: 0
 *                       description: Image display order
 *                       example: 1
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Review created"
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174002"
 *                 orderItemId: "123e4567-e89b-12d3-a456-426614174001"
 *                 rating: 5
 *                 title: "Great product!"
 *                 text: "This product exceeded my expectations..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: User not authorized to review this order item
 *       409:
 *         description: Review already exists for this order item
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/create",
  validation.createValidation,
  asyncHandler(controller.create)
);

/**
 * @swagger
 * /api/review/{id}:
 *   patch:
 *     summary: Update an existing review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review ID
 *         example: "123e4567-e89b-12d3-a456-426614174002"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Updated rating from 1 to 5
 *                 example: 4
 *               title:
 *                 type: string
 *                 maxLength: 120
 *                 description: Updated review title
 *                 example: "Updated review title"
 *               text:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Updated review text content
 *                 example: "Updated review content..."
 *               images:
 *                 type: array
 *                 description: Updated review images
 *                 items:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       description: Image URL
 *                       example: "https://example.com/image.jpg"
 *                     imageKey:
 *                       type: string
 *                       description: S3 key or file path
 *                       example: "reviews/user123/image1.jpg"
 *                     altText:
 *                       type: string
 *                       description: Alt text for accessibility
 *                       example: "Product in use"
 *                     sortOrder:
 *                       type: integer
 *                       minimum: 0
 *                       description: Image display order
 *                       example: 1
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Review updated"
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174002"
 *                 rating: 4
 *                 title: "Updated review title"
 *                 text: "Updated review content..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: User not authorized to update this review
 *       404:
 *         description: Review not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch(
  "/:id",
  validation.updateValidation,
  asyncHandler(controller.update)
);

/**
 * @swagger
 * /api/review/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review ID
 *         example: "123e4567-e89b-12d3-a456-426614174002"
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Review deleted"
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: User not authorized to delete this review
 *       404:
 *         description: Review not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/:id",
  validation.deleteValidation,
  asyncHandler(controller.remove)
);

/**
 * @swagger
 * /api/review/product/{productId}:
 *   get:
 *     summary: Get reviews for a specific product
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 10
 *         description: Number of reviews per page
 *         example: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, highest, lowest]
 *           default: newest
 *         description: Sort order for reviews
 *         example: newest
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Product reviews retrieved"
 *               data:
 *                 reviews:
 *                   - id: "123e4567-e89b-12d3-a456-426614174002"
 *                     rating: 5
 *                     title: "Great product!"
 *                     text: "This product exceeded my expectations..."
 *                     reviewer: "John Doe"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     helpfulCount: 3
 *                     orderItem:
 *                       id: "123e4567-e89b-12d3-a456-426614174001"
 *                       productVariant:
 *                         product:
 *                           name: "Product Name"
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 25
 *                   totalPages: 3
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Product not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/product/:productId",
  validation.productListValidation,
  asyncHandler(controller.getProductReviews)
);

/**
 * @swagger
 * /api/review/my:
 *   get:
 *     summary: Get current user's reviews
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 10
 *         description: Number of reviews per page
 *         example: 10
 *     responses:
 *       200:
 *         description: User reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "User reviews retrieved"
 *               data:
 *                 reviews:
 *                   - id: "123e4567-e89b-12d3-a456-426614174002"
 *                     orderItemId: "123e4567-e89b-12d3-a456-426614174001"
 *                     rating: 5
 *                     title: "Great product!"
 *                     text: "This product exceeded my expectations..."
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     helpfulCount: 3
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 5
 *                   totalPages: 1
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/my",
  validation.myListValidation,
  asyncHandler(controller.getMyReviews)
);

/**
 * @swagger
 * /api/review/store/{storeId}:
 *   get:
 *     summary: Get reviews for a specific store
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Store ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 10
 *         description: Number of reviews per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Store reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Store reviews retrieved"
 *               data:
 *                 reviews:
 *                   - publicId: "123e4567-e89b-12d3-a456-426614174002"
 *                     rating: 5
 *                     title: "Great product!"
 *                     text: "This product exceeded my expectations..."
 *                     helpfulCount: 3
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     images:
 *                       - imageUrl: "https://example.com/image.jpg"
 *                         sortOrder: 1
 *                     reviewer:
 *                       publicId: "123e4567-e89b-12d3-a456-426614174004"
 *                       email: "reviewer@example.com"
 *                 pagination:
 *                   total: 25
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 3
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Store not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/store/:storeId",
  validation.storeListValidation,
  asyncHandler(controller.getStoreReviews)
);

/**
 * @swagger
 * /api/review/store/{storeId}/histogram:
 *   get:
 *     summary: Get rating histogram for a specific store
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Store ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Store rating histogram retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Store rating histogram retrieved"
 *               data:
 *                 "1": 5
 *                 "2": 2
 *                 "3": 3
 *                 "4": 10
 *                 "5": 15
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Store not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/store/:storeId/histogram",
  validation.storeHistogramValidation,
  asyncHandler(controller.getStoreRatingHistogram)
);

/**
 * @swagger
 * /api/review/presigned-url:
 *   post:
 *     summary: Generate presigned URL for review image upload
 *     tags: [Review]
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
 *                 description: Name of the file to upload
 *                 example: "review-image.jpg"
 *               contentType:
 *                 type: string
 *                 pattern: "^image/(jpeg|jpg|png|gif|webp)$"
 *                 description: MIME type of the image file
 *                 example: "image/jpeg"
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Presigned URL generated successfully"
 *               data:
 *                 presignedUrl: "https://s3.amazonaws.com/bucket/presigned-url..."
 *                 key: "reviews/user123/review-image.jpg"
 *                 url: "https://bucket.s3.region.amazonaws.com/reviews/user123/review-image.jpg"
 *                 bucket: "my-bucket"
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
 * /api/review/{id}/helpful:
 *   post:
 *     summary: Mark a review as helpful
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review ID
 *         example: "123e4567-e89b-12d3-a456-426614174002"
 *     responses:
 *       200:
 *         description: Review marked as helpful successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Marked helpful"
 *               data: null
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Review not found
 *       409:
 *         description: Review already marked as helpful by this user
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/:id/helpful",
  validation.helpfulValidation,
  asyncHandler(controller.markHelpful)
);

/**
 * @swagger
 * /api/review/{id}/helpful:
 *   delete:
 *     summary: Remove helpful mark from a review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review ID
 *         example: "123e4567-e89b-12d3-a456-426614174002"
 *     responses:
 *       200:
 *         description: Helpful mark removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Unmarked helpful"
 *               data: null
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Review not found or not marked as helpful by this user
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/:id/helpful",
  validation.helpfulValidation,
  asyncHandler(controller.unmarkHelpful)
);

module.exports = router;
