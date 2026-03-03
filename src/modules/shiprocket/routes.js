const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const { authenticate } = require("../../middleware/auth");

router.post(
  "/shipping-rates",
  validation.calculateShippingRatesValidation,
  controller.calculateShippingRates
);

router.post(
  "/estimated-delivery",
  validation.estimatedDeliveryValidation,
  controller.getEstimatedDeliveryDate
);

router.post("/webhook", validation.webhookValidation, controller.handleWebhook);

router.use(authenticate);

router.post(
  "/orders",
  validation.createOrderValidation,
  controller.createOrder
);

router.get("/orders", validation.listOrdersValidation, controller.listOrders);

router.get(
  "/orders/:orderId/track",
  validation.trackOrderValidation,
  controller.trackOrder
);

router.post(
  "/orders/:orderId/ship",
  validation.shipOrderValidation,
  controller.shipOrder
);

router.post(
  "/orders/:orderId/pickup",
  validation.schedulePickupValidation,
  controller.schedulePickup
);

router.get(
  "/orders/:orderId/label",
  validation.generateLabelValidation,
  controller.generateShipmentLabel
);

router.delete(
  "/orders/:orderId",
  validation.cancelOrderValidation,
  controller.cancelOrder
);

router.get("/pickup-addresses", controller.listPickupAddresses);

router.get("/couriers", controller.getCouriersList);

router.get(
  "/shipments/:shipmentId",
  validation.getShipmentValidation,
  controller.getShipmentById
);

router.get(
  "/shipments",
  validation.getShipmentsBySellerValidation,
  controller.getShipmentsBySeller
);

router.put(
  "/shipments/:shipmentId",
  validation.updateShipmentValidation,
  controller.updateShipment
);

router.post(
  "/shipments/:shipmentId/assign-awb",
  validation.assignAwbValidation,
  controller.assignAwb
);

router.delete(
  "/shipments/:shipmentId",
  validation.deleteShipmentValidation,
  controller.deleteShipment
);

router.get(
  "/admin/shipments",
  validation.getAllShipmentsValidation,
  controller.getAllShipments
);

router.post(
  "/returns",
  validation.createReturnOrderValidation,
  controller.createReturnOrder
);

router.post(
  "/exchange",
  validation.createExchangeOrderValidation,
  controller.createExchangeOrder
);

module.exports = router;
