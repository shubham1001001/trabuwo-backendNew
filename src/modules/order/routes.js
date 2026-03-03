const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique order identifier
 *         buyerId:
 *           type: integer
 *           description: ID of the buyer
 *         sellerId:
 *           type: integer
 *           description: ID of the seller
 *         status:
 *           type: string
 *           enum: [pending, ready_to_ship, shipped, cancelled]
 *           description: Current order status
 *         totalAmount:
 *           type: number
 *           format: decimal
 *           description: Total order amount
 *         shippingAddressId:
 *           type: integer
 *           description: ID of the shipping address
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Order last update timestamp
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         buyer:
 *           $ref: '#/components/schemas/User'
 *         shippingAddress:
 *           $ref: '#/components/schemas/Address'
 *
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique order item identifier
 *         orderId:
 *           type: string
 *           format: uuid
 *           description: Associated order ID
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Associated product ID
 *         quantity:
 *           type: integer
 *           description: Quantity ordered
 *         price:
 *           type: number
 *           format: decimal
 *           description: Unit price at time of order
 *         product:
 *           $ref: '#/components/schemas/Product'
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         mobile:
 *           type: string
 *           description: User mobile number
 *
 *     Address:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Address ID
 *         addressLine1:
 *           type: string
 *           description: Primary address line
 *         addressLine2:
 *           type: string
 *           description: Secondary address line
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State name
 *         postalCode:
 *           type: string
 *           description: Postal code
 *         location:
 *           $ref: '#/components/schemas/Location'
 *
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Location ID
 *         country:
 *           type: string
 *           description: Country name
 *
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         price:
 *           type: number
 *           format: decimal
 *           description: Product price
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             description: Product image URLs
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of records
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of records per page
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *
 *     OrdersResponse:
 *       type: object
 *       properties:
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMeta'
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Request success status
 *         data:
 *           description: Response data
 *         message:
 *           type: string
 *           description: Response message
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               description: Error message
 *             code:
 *               type: string
 *               description: Error code
 *             statusCode:
 *               type: integer
 *               description: HTTP status code
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication
 */

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints for sellers
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/order/seller/orders:
 *   get:
 *     summary: Get all orders for seller with filtering and pagination
 *     description: Retrieve orders for the authenticated seller with optional status filtering and pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, ready_to_ship, shipped, cancelled]
 *         description: Filter orders by status
 *         example: pending
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: productName
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search orders by product name (supports full-text search and fuzzy matching)
 *         example: "iPhone"
 *       - in: query
 *         name: skuId
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         description: Filter orders by specific SKU ID
 *         example: "SKU123456"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of orders per page
 *         example: 10
 *       - in: query
 *         name: startDispatchDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders by dispatch date (start range)
 *         example: "2024-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endDispatchDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders by dispatch date (end range)
 *         example: "2024-12-31T23:59:59.999Z"
 *       - in: query
 *         name: startSlaDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders by SLA date (start range)
 *         example: "2024-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endSlaDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders by SLA date (end range)
 *         example: "2024-12-31T23:59:59.999Z"
 *       - in: query
 *         name: slaStatus
 *         schema:
 *           type: string
 *           enum: [breached, breaching_soon, other]
 *         description: Filter orders by SLA status
 *         example: "breached"
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/OrdersResponse'
 *             example:
 *               success: true
 *               data:
 *                 orders:
 *                   - id: "123e4567-e89b-12d3-a456-426614174000"
 *                     buyerId: 1
 *                     sellerId: 2
 *                     status: "pending"
 *                     totalAmount: "150.00"
 *                     shippingAddressId: 1
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                     items:
 *                       - id: "456e7890-e89b-12d3-a456-426614174001"
 *                         orderId: "123e4567-e89b-12d3-a456-426614174000"
 *                         productId: "789e0123-e89b-12d3-a456-426614174002"
 *                         quantity: 2
 *                         price: "75.00"
 *                         product:
 *                           id: "789e0123-e89b-12d3-a456-426614174002"
 *                           name: "Sample Product"
 *                           price: "75.00"
 *                           images: ["https://example.com/image1.jpg"]
 *                     buyer:
 *                       id: 1
 *                       email: "buyer@example.com"
 *                       mobile: "+1234567890"
 *                     shippingAddress:
 *                       id: 1
 *                       addressLine1: "123 Main St"
 *                       city: "New York"
 *                       state: "NY"
 *                       postalCode: "10001"
 *                       location:
 *                         id: 1
 *                         country: "United States"
 *                 pagination:
 *                   total: 25
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 3
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Status must be one of: pending, ready_to_ship, shipped, cancelled"
 *                 code: "VALIDATION_ERROR"
 *                 statusCode: 400
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get all orders for seller
router.get(
  "/seller/orders",
  validation.orderFiltersValidation,
  asyncHandler(controller.getSellerOrders)
);

/**
 * @swagger
 * /api/order/seller/orders/{id}:
 *   get:
 *     summary: Get specific order details for seller
 *     description: Retrieve detailed information about a specific order for the authenticated seller
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 buyerId: 1
 *                 sellerId: 2
 *                 status: "pending"
 *                 totalAmount: "150.00"
 *                 shippingAddressId: 1
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *                 items:
 *                   - id: "456e7890-e89b-12d3-a456-426614174001"
 *                     orderId: "123e4567-e89b-12d3-a456-426614174000"
 *                     productId: "789e0123-e89b-12d3-a456-426614174002"
 *                     quantity: 2
 *                     price: "75.00"
 *                     product:
 *                       id: "789e0123-e89b-12d3-a456-426614174002"
 *                       name: "Sample Product"
 *                       price: "75.00"
 *                       images: ["https://example.com/image1.jpg"]
 *                 buyer:
 *                   id: 1
 *                   email: "buyer@example.com"
 *                   mobile: "+1234567890"
 *                 shippingAddress:
 *                   id: 1
 *                   addressLine1: "123 Main St"
 *                   city: "New York"
 *                   state: "NY"
 *                   postalCode: "10001"
 *                   location:
 *                     id: 1
 *                     country: "United States"
 *       400:
 *         description: Invalid order ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get specific order for seller
router.get(
  "/seller/orders/:id",
  validation.getOrderValidation,
  asyncHandler(controller.getSellerOrderById)
);

/**
 * @swagger
 * /api/order/seller/orders/{id}/accept:
 *   put:
 *     summary: Accept order (change status to ready_to_ship)
 *     description: Accept an order and change its status to ready_to_ship
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Order accepted successfully
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
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           enum: [ready_to_ship]
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "ready_to_ship"
 *               message: "Order accepted successfully"
 *       400:
 *         description: Invalid order ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Order cannot be accepted (wrong status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Accept order (PUT - existing endpoint, kept for backward compatibility)
router.put(
  "/seller/orders/:id/accept",
  validation.acceptOrderValidation,
  asyncHandler(controller.acceptOrder)
);

/**
 * @swagger
 * /api/order/seller/orders/{orderPublicId}/accept:
 *   post:
 *     summary: Accept order and create Shiprocket shipment
 *     description: Accept an order, create a forward shipment in Shiprocket, and update order status to ready_to_ship
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderPublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order public ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Order accepted and shipment created successfully
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
 *                         orderPublicId:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           enum: [ready_to_ship]
 *                         shipment:
 *                           type: object
 *                           properties:
 *                             shipmentId:
 *                               type: string
 *                             awbCode:
 *                               type: string
 *                             courierCompanyName:
 *                               type: string
 *                             pickupLocation:
 *                               type: string
 *             example:
 *               success: true
 *               message: "Order accepted and shipment created successfully"
 *               data:
 *                 orderPublicId: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "ready_to_ship"
 *                 shipment:
 *                   shipmentId: "123456"
 *                   awbCode: "AWB123456"
 *                   courierCompanyName: "Delhivery"
 *                   pickupLocation: "HomeNew"
 *       400:
 *         description: Invalid order ID format or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found or seller onboarding not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Order cannot be accepted (wrong status or shipment already exists)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error or Shiprocket integration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Accept order (POST - new endpoint with Shiprocket integration)
router.post(
  "/seller/orders/:orderPublicId/accept",
  validation.acceptOrderPostValidation,
  asyncHandler(controller.acceptOrder)
);

/**
 * @swagger
 * /api/order/seller/orders/{id}/cancel:
 *   put:
 *     summary: Cancel order (with Shiprocket integration)
 *     description: Cancel an order and change its status to cancelled. If the order has a Shiprocket order ID, it will also be cancelled in Shiprocket. Otherwise, only the local order status will be updated.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order public ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Order cancelled successfully
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
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           enum: [cancelled]
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "cancelled"
 *               message: "Order cancelled successfully"
 *       400:
 *         description: Invalid order ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Order cannot be cancelled (wrong status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error or Shiprocket integration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Cancel order
router.put(
  "/seller/orders/:id/cancel",
  validation.cancelOrderValidation,
  asyncHandler(controller.cancelOrder)
);

/**
 * @swagger
 * /api/order/seller/orders/{id}/shipping-label:
 *   get:
 *     summary: Download shipping label
 *     description: Download shipping label for an order and change status to shipped
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Shipping label downloaded successfully
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
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           enum: [shipped]
 *                         labelUrl:
 *                           type: string
 *                           format: uri
 *                           description: URL to download the shipping label
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "shipped"
 *                 labelUrl: "https://example.com/shipping-labels/123e4567-e89b-12d3-a456-426614174000.pdf"
 *               message: "Shipping label downloaded successfully"
 *       400:
 *         description: Invalid order ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Order cannot be shipped (wrong status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Download shipping label
router.get(
  "/seller/orders/:id/shipping-label",
  validation.downloadShippingLabelValidation,
  asyncHandler(controller.downloadShippingLabel)
);

/**
 * @swagger
 * /api/order/seller/orders/stats/last-30-days:
 *   get:
 *     summary: Get order statistics for the last 30 days
 *     description: Get the number of orders and total sales amount for the past 30 days
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
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
 *                         orderCount:
 *                           type: integer
 *                           description: Number of orders in the last 30 days
 *                           example: 45
 *                         totalSales:
 *                           type: number
 *                           format: decimal
 *                           description: Total sales amount in the last 30 days
 *                           example: 12500.50
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 orderCount: 45
 *                 totalSales: 12500.50
 *               message: "Order statistics retrieved successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get order statistics for last 30 days
router.get(
  "/seller/orders/stats/last-30-days",
  authenticate,
  asyncHandler(controller.getOrdersStatsLast30Days)
);

/**
 * @swagger
 * /api/order/seller/dashboard:
 *   get:
 *     summary: Get seller dashboard statistics
 *     description: Get aggregated statistics for seller including stock levels and order counts
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                         stock:
 *                           type: object
 *                           properties:
 *                             lowStock:
 *                               type: integer
 *                               description: Number of products with stock between 1-9
 *                               example: 5
 *                             outOfStock:
 *                               type: integer
 *                               description: Number of products with stock = 0
 *                               example: 3
 *                         orders:
 *                           type: object
 *                           properties:
 *                             pending:
 *                               type: integer
 *                               description: Number of orders with pending status
 *                               example: 12
 *                             readyToShip:
 *                               type: integer
 *                               description: Number of orders with ready_to_ship status
 *                               example: 8
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 stock:
 *                   lowStock: 5
 *                   outOfStock: 3
 *                 orders:
 *                   pending: 12
 *                   readyToShip: 8
 *               message: "Dashboard statistics retrieved successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get seller dashboard statistics
router.get(
  "/seller/dashboard",
  authenticate,
  asyncHandler(controller.getSellerDashboard)
);

/**
 * @swagger
 * /api/order/buyer/orders:
 *   get:
 *     summary: Get all orders for buyer with pagination
 *     description: Retrieve paginated list of orders for the authenticated buyer, including order items, product/variant details, and product images
 *     tags: [Orders]
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
 *           maximum: 100
 *           default: 10
 *         description: Number of orders per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                         orders:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               publicId:
 *                                 type: string
 *                                 format: uuid
 *                                 description: Order public ID
 *                               status:
 *                                 type: string
 *                                 enum: [on_hold, pending, ready_to_ship, shipped, cancelled]
 *                                 description: Order status
 *                               totalAmount:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Total order amount
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Order creation timestamp
 *                               items:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     publicId:
 *                                       type: string
 *                                       format: uuid
 *                                       description: Order item public ID
 *                                     quantity:
 *                                       type: integer
 *                                       description: Quantity ordered
 *                                     price:
 *                                       type: number
 *                                       format: decimal
 *                                       description: Unit price at time of order
 *                                     productVariant:
 *                                       type: object
 *                                       properties:
 *                                         publicId:
 *                                           type: string
 *                                           format: uuid
 *                                           description: Product variant public ID
 *                                         trabuwoPrice:
 *                                           type: number
 *                                           format: decimal
 *                                           description: Trabuwo selling price
 *                                         mrp:
 *                                           type: number
 *                                           format: decimal
 *                                           description: Maximum Retail Price
 *                                         dynamicFields:
 *                                           type: object
 *                                           description: Variant dynamic fields (size, color, etc.)
 *                                           example:
 *                                             size: "M"
 *                                             color: "Red"
 *                                         product:
 *                                           type: object
 *                                           properties:
 *                                             publicId:
 *                                               type: string
 *                                               format: uuid
 *                                               description: Product public ID
 *                                             name:
 *                                               type: string
 *                                               description: Product name
 *                                             description:
 *                                               type: string
 *                                               description: Product description
 *                                             images:
 *                                               type: array
 *                                               items:
 *                                                 type: object
 *                                                 properties:
 *                                                   publicId:
 *                                                     type: string
 *                                                     format: uuid
 *                                                     description: Image public ID
 *                                                   imageUrl:
 *                                                     type: string
 *                                                     format: uri
 *                                                     description: Image URL
 *                                                   imageKey:
 *                                                     type: string
 *                                                     description: Image key
 *                                                   altText:
 *                                                     type: string
 *                                                     description: Image alt text
 *                                                   caption:
 *                                                     type: string
 *                                                     description: Image caption
 *                                                   sortOrder:
 *                                                     type: integer
 *                                                     description: Image sort order
 *                                                   isPrimary:
 *                                                     type: boolean
 *                                                     description: Whether this is the primary image
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *             example:
 *               success: true
 *               data:
 *                 orders:
 *                   - publicId: "123e4567-e89b-12d3-a456-426614174000"
 *                     status: "pending"
 *                     totalAmount: "150.00"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     items:
 *                       - publicId: "456e7890-e89b-12d3-a456-426614174001"
 *                         quantity: 2
 *                         price: "75.00"
 *                         productVariant:
 *                           publicId: "789e0123-e89b-12d3-a456-426614174002"
 *                           trabuwoPrice: "75.00"
 *                           mrp: "100.00"
 *                           dynamicFields:
 *                             size: "M"
 *                             color: "Red"
 *                           product:
 *                             publicId: "012e3456-e89b-12d3-a456-426614174003"
 *                             name: "Sample Product"
 *                             description: "Product description"
 *                             images:
 *                               - publicId: "345e6789-e89b-12d3-a456-426614174004"
 *                                 imageUrl: "https://example.com/image1.jpg"
 *                                 imageKey: "products/image1.jpg"
 *                                 altText: "Product image"
 *                                 caption: "Main product image"
 *                                 sortOrder: 0
 *                                 isPrimary: true
 *                 pagination:
 *                   total: 25
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 3
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Page must be a positive integer"
 *                 code: "VALIDATION_ERROR"
 *                 statusCode: 400
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.get(
  "/buyer/orders",
  validation.getBuyerOrdersValidation,
  asyncHandler(controller.getBuyerOrders)
);

/**
 * @swagger
 * /api/order/buyer/orders/{id}:
 *   get:
 *     summary: Get specific order details for buyer
 *     description: Retrieve detailed information about a specific order for the authenticated buyer, including order items, product/variant details, product images, and buyer address
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order public ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
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
 *                         publicId:
 *                           type: string
 *                           format: uuid
 *                           description: Order public ID
 *                         status:
 *                           type: string
 *                           enum: [on_hold, pending, ready_to_ship, shipped, cancelled]
 *                           description: Order status
 *                         totalAmount:
 *                           type: number
 *                           format: decimal
 *                           description: Total order amount
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Order creation timestamp
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               publicId:
 *                                 type: string
 *                                 format: uuid
 *                                 description: Order item public ID
 *                               quantity:
 *                                 type: integer
 *                                 description: Quantity ordered
 *                               price:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Unit price at time of order
 *                               productVariant:
 *                                 type: object
 *                                 properties:
 *                                   publicId:
 *                                     type: string
 *                                     format: uuid
 *                                     description: Product variant public ID
 *                                   trabuwoPrice:
 *                                     type: number
 *                                     format: decimal
 *                                     description: Trabuwo selling price
 *                                   mrp:
 *                                     type: number
 *                                     format: decimal
 *                                     description: Maximum Retail Price
 *                                   dynamicFields:
 *                                     type: object
 *                                     description: Variant dynamic fields (size, color, etc.)
 *                                     example:
 *                                       size: "M"
 *                                       color: "Red"
 *                                   product:
 *                                     type: object
 *                                     properties:
 *                                       publicId:
 *                                         type: string
 *                                         format: uuid
 *                                         description: Product public ID
 *                                       name:
 *                                         type: string
 *                                         description: Product name
 *                                       description:
 *                                         type: string
 *                                         description: Product description
 *                                       images:
 *                                         type: array
 *                                         items:
 *                                           type: object
 *                                           properties:
 *                                             publicId:
 *                                               type: string
 *                                               format: uuid
 *                                               description: Image public ID
 *                                             imageUrl:
 *                                               type: string
 *                                               format: uri
 *                                               description: Image URL
 *                                             imageKey:
 *                                               type: string
 *                                               description: Image key
 *                                             altText:
 *                                               type: string
 *                                               description: Image alt text
 *                                             caption:
 *                                               type: string
 *                                               description: Image caption
 *                                             sortOrder:
 *                                               type: integer
 *                                               description: Image sort order
 *                                             isPrimary:
 *                                               type: boolean
 *                                               description: Whether this is the primary image
 *                         buyerAddress:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             publicId:
 *                               type: string
 *                               format: uuid
 *                               description: Address public ID
 *                             name:
 *                               type: string
 *                               description: Recipient name
 *                             phoneNumber:
 *                               type: string
 *                               description: Phone number
 *                             buildingNumber:
 *                               type: string
 *                               description: Building number
 *                             street:
 *                               type: string
 *                               description: Street address
 *                             landmark:
 *                               type: string
 *                               description: Landmark
 *                             addressType:
 *                               type: string
 *                               enum: [home, work, other]
 *                               description: Address type
 *                             isDefault:
 *                               type: boolean
 *                               description: Whether this is the default address
 *                             location:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 pincode:
 *                                   type: string
 *                                   description: Pincode
 *                                 city:
 *                                   type: string
 *                                   description: City name
 *                                 state:
 *                                   type: string
 *                                   description: State name
 *             example:
 *               success: true
 *               data:
 *                 publicId: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "pending"
 *                 totalAmount: "150.00"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 items:
 *                   - publicId: "456e7890-e89b-12d3-a456-426614174001"
 *                     quantity: 2
 *                     price: "75.00"
 *                     productVariant:
 *                       publicId: "789e0123-e89b-12d3-a456-426614174002"
 *                       trabuwoPrice: "75.00"
 *                       mrp: "100.00"
 *                       dynamicFields:
 *                         size: "M"
 *                         color: "Red"
 *                       product:
 *                         publicId: "012e3456-e89b-12d3-a456-426614174003"
 *                         name: "Sample Product"
 *                         description: "Product description"
 *                         images:
 *                           - publicId: "345e6789-e89b-12d3-a456-426614174004"
 *                             imageUrl: "https://example.com/image1.jpg"
 *                             imageKey: "products/image1.jpg"
 *                             altText: "Product image"
 *                             caption: "Main product image"
 *                             sortOrder: 0
 *                             isPrimary: true
 *                 buyerAddress:
 *                   publicId: "567e8901-e89b-12d3-a456-426614174005"
 *                   name: "John Doe"
 *                   phoneNumber: "+1234567890"
 *                   buildingNumber: "123"
 *                   street: "Main Street"
 *                   landmark: "Near Park"
 *                   addressType: "home"
 *                   isDefault: true
 *                   location:
 *                     pincode: "123456"
 *                     city: "New York"
 *                     state: "NY"
 *       400:
 *         description: Invalid order ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Order ID must be a valid UUID"
 *                 code: "VALIDATION_ERROR"
 *                 statusCode: 400
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Order not found"
 *                 code: "NOT_FOUND"
 *                 statusCode: 404
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.get(
  "/buyer/orders/:id",
  validation.getBuyerOrderByIdValidation,
  asyncHandler(controller.getBuyerOrderById)
);
/**
 * @swagger
 * /api/order/buyer/buy-now:
 *   post:
 *     summary: Buy a single product variant directly
 *     description: Create an order and payment for a single product variant using the provided address and quantity, bypassing the cart.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productVariantId
 *               - userAddressPublicId
 *               - quantity
 *             properties:
 *               productVariantId:
 *                 type: string
 *                 format: uuid
 *                 description: Public ID of the product variant to purchase
 *               userAddressPublicId:
 *                 type: string
 *                 format: uuid
 *                 description: Public ID of the buyer's address to use for this order
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of the product variant to purchase
 *           example:
 *             productVariantId: "789e0123-e89b-12d3-a456-426614174002"
 *             userAddressPublicId: "567e8901-e89b-12d3-a456-426614174005"
 *             quantity: 1
 *     responses:
 *       200:
 *         description: Buy now initiated successfully
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
 *                         orderId:
 *                           type: string
 *                           format: uuid
 *                           description: Order public ID
 *                         status:
 *                           type: string
 *                           enum: [on_hold, pending, ready_to_ship, shipped, cancelled]
 *                         totalAmount:
 *                           type: number
 *                           format: decimal
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               productVariantId:
 *                                 type: string
 *                                 format: uuid
 *                               quantity:
 *                                 type: integer
 *                               price:
 *                                 type: number
 *                                 format: decimal
 *                         payment:
 *                           type: object
 *             example:
 *               success: true
 *               message: "Buy now initiated successfully"
 *               data:
 *                 orderId: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "pending"
 *                 totalAmount: 150.0
 *                 items:
 *                   - productVariantId: "789e0123-e89b-12d3-a456-426614174002"
 *                     quantity: 2
 *                     price: 75.0
 *                 payment:
 *                   id: "pay_123"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product variant or address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Business validation error (e.g., insufficient inventory)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.post(
  "/buyer/buy-now",
  validation.buyNowValidation,
  asyncHandler(controller.buyNow)
);

router.post(
  "/checkout",
  authenticate,
  validation.checkoutValidation,
  asyncHandler(controller.checkout)
);

module.exports = router;
