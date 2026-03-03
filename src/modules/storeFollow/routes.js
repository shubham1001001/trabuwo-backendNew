const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const {
  authenticate,
  requireRole,
  attachUserIfPresent,
} = require("../../middleware/auth");

/**
 * @swagger
 * /api/store-follow/seller/{sellerPublicId}/stats:
 *   get:
 *     summary: Get seller statistics
 *     description: Get seller statistics including average rating, rating count, catalogues count, and followers count. Authentication is optional.
 *     tags: [Store Follow]
 *     operationId: getSellerStats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerPublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the seller
 *     responses:
 *       200:
 *         description: Seller stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         averageRating:
 *                           type: number
 *                           format: float
 *                           description: Average rating from all seller's products
 *                           example: 4.5
 *                         ratingCount:
 *                           type: integer
 *                           description: Total number of ratings/reviews
 *                           example: 120
 *                         cataloguesCount:
 *                           type: integer
 *                           description: Total number of catalogues
 *                           example: 15
 *                         followersCount:
 *                           type: integer
 *                           description: Total number of store followers
 *                           example: 250
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 averageRating: 4.5
 *                 ratingCount: 120
 *                 cataloguesCount: 15
 *                 followersCount: 250
 *               message: "Seller stats retrieved successfully"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Seller public ID must be a valid UUID"
 *               code: "VALIDATION_ERROR"
 *               details: null
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Seller not found"
 *               code: "NOT_FOUND_ERROR"
 *               details: null
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/seller/:sellerPublicId/stats",
  attachUserIfPresent,
  validation.sellerPublicIdValidation,
  asyncHandler(controller.getSellerStats)
);

router.use(authenticate);
router.use(requireRole("buyer"));

/**
 * @swagger
 * /api/store-follow/follow/{storeId}:
 *   post:
 *     summary: Follow a store
 *     description: Follow a specific store to get updates and notifications. Users can only follow stores they don't own.
 *     tags: [Store Follow]
 *     operationId: followStore
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the store to follow
 *     responses:
 *       201:
 *         description: Store followed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreFollowResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidStoreId:
 *                 summary: Invalid store ID
 *                 value:
 *                   success: false
 *                   message: "Store ID must be a valid UUID"
 *                   code: "VALIDATION_ERROR"
 *                   details: null
 *               ownStore:
 *                 summary: Trying to follow own store
 *                 value:
 *                   success: false
 *                   message: "You cannot follow your own store"
 *                   code: "BAD_REQUEST"
 *                   details: null
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Store not found"
 *               code: "NOT_FOUND_ERROR"
 *               details: null
 *       409:
 *         description: Already following
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "You are already following this store"
 *               code: "CONFLICT_ERROR"
 *               details: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/follow/:storeId",
  validation.storeIdValidation,
  asyncHandler(controller.followStore)
);

/**
 * @swagger
 * /api/store-follow/unfollow/{storeId}:
 *   delete:
 *     summary: Unfollow a store
 *     description: Stop following a specific store. This will remove the user from the store's followers list.
 *     tags: [Store Follow]
 *     operationId: unfollowStore
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the store to unfollow
 *     responses:
 *       200:
 *         description: Store unfollowed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreUnfollowResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Store ID must be a valid UUID"
 *               code: "VALIDATION_ERROR"
 *               details: null
 *       404:
 *         description: Not following this store
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "You are not following this store"
 *               code: "NOT_FOUND_ERROR"
 *               details: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/unfollow/:storeId",
  validation.storeIdValidation,
  asyncHandler(controller.unfollowStore)
);

/**
 * @swagger
 * /api/store-follow/my-follows:
 *   get:
 *     summary: Get user's followed stores
 *     description: Retrieve all stores that the authenticated user is following. Returns store information including publicId and name.
 *     tags: [Store Follow]
 *     operationId: getUserFollowedStores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Followed stores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FollowedStoresResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/my-follows", asyncHandler(controller.getUserFollowedStores));

/**
 * @swagger
 * /api/store-follow/store/{storeId}/followers:
 *   get:
 *     summary: Get store followers
 *     description: Retrieve all users who are following a specific store. Returns user information including publicId.
 *     tags: [Store Follow]
 *     operationId: getStoreFollowers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the store
 *     responses:
 *       200:
 *         description: Store followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreFollowersResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Store ID must be a valid UUID"
 *               code: "VALIDATION_ERROR"
 *               details: null
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Store not found"
 *               code: "NOT_FOUND_ERROR"
 *               details: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/store/:storeId/followers",
  validation.storeIdValidation,
  asyncHandler(controller.getStoreFollowers)
);

/**
 * @swagger
 * /api/store-follow/check/{storeId}:
 *   get:
 *     summary: Check if user follows store
 *     description: Check if the authenticated user is following a specific store. Returns a boolean indicating the follow status.
 *     tags: [Store Follow]
 *     operationId: checkUserFollowsStore
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the store to check
 *     responses:
 *       200:
 *         description: Follow status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FollowStatusResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Store ID must be a valid UUID"
 *               code: "VALIDATION_ERROR"
 *               details: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/check/:storeId",
  validation.storeIdValidation,
  asyncHandler(controller.checkUserFollowsStore)
);

/**
 * @swagger
 * /api/store-follow/store/{storeId}/followers-count:
 *   get:
 *     summary: Get store followers count
 *     description: Get the total number of followers for a specific store. Returns the count as an integer.
 *     tags: [Store Follow]
 *     operationId: getStoreFollowersCount
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "01234567-89ab-7def-0123-456789abcdef"
 *         description: The public ID of the store
 *     responses:
 *       200:
 *         description: Followers count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FollowersCountResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Store ID must be a valid UUID"
 *               code: "VALIDATION_ERROR"
 *               details: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/store/:storeId/followers-count",
  validation.storeIdValidation,
  asyncHandler(controller.getStoreFollowersCount)
);

/**
 * @swagger
 * /api/store-follow/my-follows-count:
 *   get:
 *     summary: Get user's follows count
 *     description: Get the total number of stores the authenticated user is following. Returns the count as an integer.
 *     tags: [Store Follow]
 *     operationId: getUserFollowsCount
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Follows count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FollowsCountResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/my-follows-count", asyncHandler(controller.getUserFollowsCount));

module.exports = router;
