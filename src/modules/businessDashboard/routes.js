const express = require("express");
const businessDashboardController = require("./controller");
const businessDashboardValidation = require("./validation");
const { authenticate } = require("../../middleware/auth");

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/business-dashboard/products/metrics:
 *   get:
 *     summary: Get products metrics for business dashboard
 *     description: Retrieve performance metrics for products including views, clicks, orders, sales, and ratings
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filterType
 *         schema:
 *           type: string
 *           enum: [views, clicks, orders, sales, ratings]
 *         description: Type of metrics to filter by
 *         example: "sales"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [topSelling, lowSelling]
 *         description: Sort products by selling performance based on orders
 *         example: "topSelling"
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter products by category ID
 *         example: 1
 *       - in: query
 *         name: skuId
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search products by SKU ID (partial match, case-insensitive)
 *         example: "SKU123"
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
 *           maximum: 20
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Products metrics retrieved successfully
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
 *                   example: "Products metrics retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Product ID
 *                           name:
 *                             type: string
 *                             description: Product name
 *                           price:
 *                             type: number
 *                             format: float
 *                             description: Product price
 *                           stock:
 *                             type: integer
 *                             description: Available stock quantity
 *                           skuId:
 *                             type: string
 *                             description: Product SKU ID
 *                             example: "SKU123"
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             description: URL of the primary product image
 *                             example: "https://example.com/image.jpg"
 *                       currentWeekMetrics:
 *                         type: object
 *                         properties:
 *                           views:
 *                             type: integer
 *                             description: Number of product views in current week
 *                           clicks:
 *                             type: integer
 *                             description: Number of product clicks in current week
 *                           orders:
 *                             type: integer
 *                             description: Number of orders in current week
 *                           salesAmount:
 *                             type: number
 *                             format: float
 *                             description: Total sales amount in current week
 *                           avgRating:
 *                             type: number
 *                             format: float
 *                             description: Average product rating in current week
 *                       previousWeekMetrics:
 *                         type: object
 *                         properties:
 *                           views:
 *                             type: integer
 *                             description: Number of product views in previous week
 *                           clicks:
 *                             type: integer
 *                             description: Number of product clicks in previous week
 *                           orders:
 *                             type: integer
 *                             description: Number of orders in previous week
 *                           salesAmount:
 *                             type: number
 *                             format: float
 *                             description: Total sales amount in previous week
 *                           avgRating:
 *                             type: number
 *                             format: float
 *                             description: Average product rating in previous week
 *                       percentageChanges:
 *                         type: object
 *                         properties:
 *                           views:
 *                             type: number
 *                             format: float
 *                             description: Percentage change in views
 *                           clicks:
 *                             type: number
 *                             format: float
 *                             description: Percentage change in clicks
 *                           orders:
 *                             type: number
 *                             format: float
 *                             description: Percentage change in orders
 *                           salesAmount:
 *                             type: number
 *                             format: float
 *                             description: Percentage change in sales amount
 *                           avgRating:
 *                             type: number
 *                             format: float
 *                             description: Percentage change in average rating
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       data:
 *                         type: array
 *                         description: Array of product metrics
 *                       total:
 *                         type: integer
 *                         description: Total number of products
 *                       page:
 *                         type: integer
 *                         description: Current page number
 *                       limit:
 *                         type: integer
 *                         description: Number of items per page
 *                       totalPages:
 *                         type: integer
 *                         description: Total number of pages
 *       400:
 *         description: Bad request - validation error
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
 *                         example: "filterType"
 *                       message:
 *                         type: string
 *                         example: "filterType must be one of: views, clicks, orders, sales, ratings"
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
router.get(
  "/products/metrics",
  businessDashboardValidation.validateGetProductsMetrics,
  businessDashboardController.getProductsMetrics
);

/**
 * @swagger
 * /api/business-dashboard/metrics/totals:
 *   get:
 *     summary: Get total business metrics
 *     description: Retrieve overall business performance metrics for a specific date range
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           description: Start date for metrics calculation (ISO 8601 format)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           description: End date for metrics calculation (ISO 8601 format)
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Total metrics retrieved successfully
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
 *                   example: "Total metrics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentWeek:
 *                       type: object
 *                       properties:
 *                         totalViews:
 *                           type: integer
 *                           description: Total product views in current week
 *                           example: 15000
 *                         totalClicks:
 *                           type: integer
 *                           description: Total product clicks in current week
 *                           example: 3200
 *                         totalOrders:
 *                           type: integer
 *                           description: Total number of orders in current week
 *                           example: 1250
 *                         totalSalesAmount:
 *                           type: number
 *                           format: float
 *                           description: Total sales amount in current week
 *                           example: 125000.50
 *                         avgRating:
 *                           type: number
 *                           format: float
 *                           description: Average rating in current week
 *                           example: 4.2
 *                     previousWeek:
 *                       type: object
 *                       properties:
 *                         totalViews:
 *                           type: integer
 *                           description: Total product views in previous week
 *                           example: 13500
 *                         totalClicks:
 *                           type: integer
 *                           description: Total product clicks in previous week
 *                           example: 2900
 *                         totalOrders:
 *                           type: integer
 *                           description: Total number of orders in previous week
 *                           example: 1150
 *                         totalSalesAmount:
 *                           type: number
 *                           format: float
 *                           description: Total sales amount in previous week
 *                           example: 108000.00
 *                         avgRating:
 *                           type: number
 *                           format: float
 *                           description: Average rating in previous week
 *                           example: 4.1
 *                     percentageChanges:
 *                       type: object
 *                       properties:
 *                         views:
 *                           type: number
 *                           format: float
 *                           description: Percentage change in views
 *                           example: 11.1
 *                         clicks:
 *                           type: number
 *                           format: float
 *                           description: Percentage change in clicks
 *                           example: 10.3
 *                         orders:
 *                           type: number
 *                           format: float
 *                           description: Percentage change in orders
 *                           example: 8.7
 *                         salesAmount:
 *                           type: number
 *                           format: float
 *                           description: Percentage change in sales amount
 *                           example: 15.7
 *                         avgRating:
 *                           type: number
 *                           format: float
 *                           description: Percentage change in average rating
 *                           example: 2.4
 *       400:
 *         description: Bad request - validation error
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
 *                         example: "startDate"
 *                       message:
 *                         type: string
 *                         example: "startDate must be a valid ISO date"
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
router.get(
  "/metrics/totals",
  businessDashboardValidation.validateGetTotalMetrics,
  businessDashboardController.getTotalMetrics
);

/**
 * @swagger
 * /api/business-dashboard/weekly-comparison-stats:
 *   get:
 *     summary: Get weekly comparison statistics for products
 *     description: Retrieve statistics about total products and products losing views/orders based on weekly comparison
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly comparison stats retrieved successfully
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
 *                   example: "Weekly comparison stats retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                       description: Total number of products
 *                       example: 85
 *                     productsLosingViews:
 *                       type: integer
 *                       description: Number of products losing views this week
 *                       example: 12
 *                     productsLosingOrders:
 *                       type: integer
 *                       description: Number of products losing orders this week
 *                       example: 8
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
router.get(
  "/weekly-comparison-stats",
  businessDashboardController.getWeeklyComparisonStats
);



/**
 * @swagger
 * /api/business-dashboard/dashboard-cards:
 *   get:
 *     summary: Get dashboard cards data
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard cards retrieved successfully
 */
router.get(
  "/dashboard-cards",
  businessDashboardController.getDashboardCards
);



/**
 * @swagger
 * /api/business-dashboard/seller-list:
 *   get:
 *     summary: Get seller list with pagination
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Seller list retrieved successfully
 */
router.get(
  "/seller-list",
  businessDashboardController.getSellerList
);




/**
 * @swagger
 * /api/business-dashboard/buyer-list:
 *   get:
 *     summary: Get buyer list with pagination
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Buyer list retrieved successfully
 */
router.get(
  "/buyer-list",
  businessDashboardController.getBuyerList
);



/**
 * @swagger
 * /api/business-dashboard/order-list:
 *   get:
 *     summary: Get all orders with pagination (Admin)
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order list retrieved successfully
 */
router.get(
  "/order-list",
  businessDashboardController.getOrderList
);




/**
 * @swagger
 * /api/business-dashboard/dashboard-summary:
 *   get:
 *     summary: Get dashboard summary (Total Orders, Pending Shipments, Total Revenue)
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 */
router.get(
  "/dashboard-order-summary",
  businessDashboardController.getDashboardSummary
);




/**
 * @swagger
 * /api/business-dashboard/dashboard-risk-summary:
 *   get:
 *     summary: Get total buyers, high return flags and risk alerts (Admin)
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard risk summary retrieved successfully
 */
router.get(
  "/dashboard-risk-summary",
  businessDashboardController.getDashboardRiskSummary
);


/**
 * @swagger
 * /api/business-dashboard/payment-overview:
 *   get:
 *     summary: Get payment overview including cards, gateway distribution and failed logs
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment overview retrieved successfully
 */
router.get(
  "/payment-overview",
  businessDashboardController.getPaymentOverview
);

/**
 * @swagger
 * /api/business-dashboard/dashboard-graph:
 *   get:
 *     summary: Get dashboard graph data (daily revenue & payments)
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard graph retrieved successfully
 */
router.get(
  "/dashboard-graph",
  businessDashboardController.getDashboardGraph
);


/**
 * @swagger
 * /api/business-dashboard/top-selling-categories:
 *   get:
 *     summary: Get top selling categories
 *     tags: [Business Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top selling categories retrieved successfully
 */
router.get(
  "/top-selling-categories",
  businessDashboardValidation.validateTopSellingCategories,
  businessDashboardController.getTopSellingCategories
);
module.exports = router;
