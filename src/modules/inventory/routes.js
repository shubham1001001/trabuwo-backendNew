const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/inventory/catalogues:
 *   get:
 *     summary: Get all catalogues with products and images
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, blocked, activation_pending]
 *         description: Primary filter for product status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *           default: newest
 *         description: Sort catalogues by created date
 *       - in: query
 *         name: stockFilter
 *         schema:
 *           type: string
 *           enum: [all_stock, out_of_stock, low_stock]
 *         description: Secondary filter for stock levels (only for active status)
 *       - in: query
 *         name: blockReasonFilter
 *         schema:
 *           type: string
 *           enum: [duplicate, poor_quality, verification_failed, account_paused, other]
 *         description: Secondary filter for block reasons (only for blocked status)
 *       - in: query
 *         name: catalogueId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Catalogue ID to filter products
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Category ID to filter catalogues
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Catalogues retrieved successfully
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
 *                     catalogues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           products:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 name:
 *                                   type: string
 *                                 description:
 *                                   type: string
 *                                 price:
 *                                   type: number
 *                                 stock:
 *                                   type: integer
 *                                 status:
 *                                   type: string
 *                                 blockReasonType:
 *                                   type: string
 *                                 images:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: integer
 *                                       imageUrl:
 *                                         type: string
 *                                       isPrimary:
 *                                         type: boolean
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Bad request - Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  "/catalogues",
  validation.getCataloguesValidation,
  controller.getCataloguesWithProducts
);

/**
 * @swagger
 * /api/inventory/products/{productId}/stock:
 *   put:
 *     summary: Update product stock
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to update stock
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: New stock quantity
 *     responses:
 *       200:
 *         description: Product stock updated successfully
 *         content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   stock:
 *                     type: integer
 *                   updatedAt:
 *                     type: string
 *       400:
 *         description: Bad request - Invalid stock value
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       403:
 *         description: Forbidden - User doesn't own the product
 */
router.put(
  "/products/:productId/stock",
  validation.updateStockValidation,
  controller.updateProductStock
);

/**
 * @swagger
 * /api/inventory/catalogues/{catalogueId}/products/pause:
 *   put:
 *     summary: Pause multiple products in a catalogue
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: catalogueId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalogue ID containing the products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 description: Array of product IDs to pause
 *     responses:
 *       200:
 *         description: Products paused successfully
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
 *                     catalogueId:
 *                       type: integer
 *                     pausedProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                           stock:
 *                             type: integer
 *                           updatedAt:
 *                             type: string
 *                     totalPaused:
 *                       type: integer
 *       400:
 *         description: Bad request - Invalid product IDs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Catalogue not found or no permission
 *       404:
 *         description: Products not found in catalogue
 */
router.put(
  "/catalogues/:catalogueId/products/pause",
  validation.bulkPauseValidation,
  controller.bulkPauseProducts
);

/**
 * @swagger
 * /api/inventory/category-tree:
 *   get:
 *     summary: Get category tree for user's catalogues
 *     description: Returns a hierarchical tree structure of categories that contain the user's catalogues
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
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
 *                   example: "Category tree retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Electronics"
 *                       parentId:
 *                         type: integer
 *                         nullable: true
 *                         example: null
 *                       isVisible:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       children:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 2
 *                             name:
 *                               type: string
 *                               example: "Mobile Phones"
 *                             parentId:
 *                               type: integer
 *                               example: 1
 *                             isVisible:
 *                               type: boolean
 *                               example: true
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                             updatedAt:
 *                               type: string
 *                               format: date-time
 *                             children:
 *                               type: array
 *                               example: []
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/category-tree", controller.getUserCategoryTree);


/**
 * @swagger
 * /api/inventory/list:
 *   get:
 *     summary: Get inventory list for logged-in user
 *     description: Returns all inventory products of the logged-in user including catalogue, category, and variants details
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "T-Shirt"
 *         description: Search by product name
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           example: 2
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Inventory list fetched successfully
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
 *                   example: "Inventory list fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       publicId:
 *                         type: string
 *                         example: "abc-123"
 *                       name:
 *                         type: string
 *                         example: "T-Shirt"
 *                       description:
 *                         type: string
 *                         example: "Cotton T-Shirt"
 *                       price:
 *                         type: number
 *                         example: 499
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       catalogue:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           name:
 *                             type: string
 *                             example: "Men Clothing"
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 2
 *                               name:
 *                                 type: string
 *                                 example: "Clothing"
 *                               parentId:
 *                                 type: integer
 *                                 example: null
 *                       variants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             sku:
 *                               type: string
 *                               example: "TS-RED-M"
 *                             price:
 *                               type: number
 *                               example: 499
 *                             stock:
 *                               type: integer
 *                               example: 20
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/list", controller.getInventoryList);












module.exports = router;
