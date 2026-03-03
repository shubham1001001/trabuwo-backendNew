const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");
const logger = require("../../config/logger");
const config = require("config");
exports.calculateShippingRates = asyncHandler(async (req, res) => {
  const rates = await service.calculateShippingRates(req.body);

  return apiResponse.success(
    res,
    rates,
    "Shipping rates calculated successfully"
  );
});

exports.getEstimatedDeliveryDate = asyncHandler(async (req, res) => {
  const deliveryData = await service.getEstimatedDeliveryDate(req.body);

  return apiResponse.success(
    res,
    deliveryData,
    "Estimated delivery date retrieved successfully"
  );
});

exports.createOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const buyerId = req.user.id;

  const shipment = await service.createOrder(orderId, buyerId);

  return apiResponse.success(
    res,
    shipment,
    "Shiprocket order created successfully"
  );
});

exports.listOrders = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  };

  const orders = await service.listOrders(options);

  return apiResponse.success(
    res,
    orders,
    "Shiprocket orders retrieved successfully"
  );
});

exports.trackOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const trackingData = await service.trackOrder(orderId);

  return apiResponse.success(
    res,
    trackingData,
    "Order tracking information retrieved successfully"
  );
});

exports.shipOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { courierId } = req.body;

  const shipmentData = await service.shipOrder(orderId, courierId);

  return apiResponse.success(res, shipmentData, "Order shipped successfully");
});

exports.schedulePickup = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { pickup_date, pickup_slot } = req.body;

  const pickupData = await service.schedulePickup(orderId, {
    pickup_date,
    pickup_slot,
  });

  return apiResponse.success(res, pickupData, "Pickup scheduled successfully");
});

exports.generateShipmentLabel = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const labelData = await service.generateShipmentLabel(orderId);

  res.setHeader("Content-Type", labelData.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${labelData.filename}"`
  );

  return res.send(labelData.pdfBuffer);
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const cancellationData = await service.cancelOrder(orderId);

  return apiResponse.success(
    res,
    cancellationData,
    "Order cancelled successfully"
  );
});

exports.listPickupAddresses = asyncHandler(async (req, res) => {
  const addresses = await service.listPickupAddresses();

  return apiResponse.success(
    res,
    addresses,
    "Pickup addresses retrieved successfully"
  );
});

exports.getCouriersList = asyncHandler(async (req, res) => {
  const couriers = await service.getCouriersList();

  return apiResponse.success(
    res,
    couriers,
    "Couriers list retrieved successfully"
  );
});

exports.getShipmentById = asyncHandler(async (req, res) => {
  const { shipmentId } = req.params;

  const shipment = await service.getShipmentById(shipmentId);

  return apiResponse.success(res, shipment, "Shipment retrieved successfully");
});

exports.getShipmentsBySeller = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const { limit, offset, status } = req.query;

  const options = {
    limit: parseInt(limit) || 10,
    offset: parseInt(offset) || 0,
    status,
  };

  const shipments = await service.getShipmentsBySeller(sellerId, options);

  return apiResponse.success(
    res,
    shipments,
    "Seller shipments retrieved successfully"
  );
});

exports.getAllShipments = asyncHandler(async (req, res) => {
  const { limit, offset, status, sellerId } = req.query;

  const options = {
    limit: parseInt(limit) || 10,
    offset: parseInt(offset) || 0,
    status,
    sellerId: sellerId ? parseInt(sellerId) : undefined,
  };

  const shipments = await service.getAllShipments(options);

  return apiResponse.success(
    res,
    shipments,
    "All shipments retrieved successfully"
  );
});

exports.updateShipment = asyncHandler(async (req, res) => {
  const { shipmentId } = req.params;
  const updateData = req.body;

  const shipment = await service.updateShipment(shipmentId, updateData);

  return apiResponse.success(res, shipment, "Shipment updated successfully");
});

exports.deleteShipment = asyncHandler(async (req, res) => {
  const { shipmentId } = req.params;

  await service.deleteShipment(shipmentId);

  return apiResponse.success(res, null, "Shipment deleted successfully");
});

exports.assignAwb = asyncHandler(async (req, res) => {
  const { shipmentId } = req.params;
  const { courierId } = req.body;

  const shipment = await service.assignAwbToShipment(shipmentId, courierId);

  return apiResponse.success(
    res,
    shipment,
    "AWB assigned to shipment successfully"
  );
});

exports.createReturnOrder = asyncHandler(async (req, res) => {
  const { orderItemPublicId } = req.body;

  const returnOrderData = await service.createReturnOrder(orderItemPublicId);

  return apiResponse.success(
    res,
    returnOrderData,
    "Return order created successfully in Shiprocket"
  );
});

exports.createExchangeOrder = asyncHandler(async (req, res) => {
  const {
    originalOrderItemPublicId,
    newOrderItemPublicId,
    sellerPickupLocationId,
    sellerShippingLocationId,
    returnReason,
    exchangeDimensions,
    returnDimensions,
  } = req.body;

  const exchangeOrderData = await service.createExchangeOrder(
    originalOrderItemPublicId,
    newOrderItemPublicId,
    {
      sellerPickupLocationId,
      sellerShippingLocationId,
      returnReason,
      exchangeDimensions,
      returnDimensions,
    }
  );

  return apiResponse.success(
    res,
    exchangeOrderData,
    "Exchange order created successfully in Shiprocket"
  );
});

exports.handleWebhook = asyncHandler(async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  const expectedApiKey = config.get("shiprocket.webhookApiKey");

  if (expectedApiKey && apiKey !== expectedApiKey) {
    logger.error("Webhook received with invalid API key", {
      receivedKey: apiKey ? "present" : "missing",
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await service.processWebhook(req.body);

  logger.info("Webhook processed", {
    processed: result.processed,
    awb: req.body?.awb,
    order_id: req.body?.order_id,
  });

  return apiResponse.success(res, result, "Webhook processed successfully");
});
