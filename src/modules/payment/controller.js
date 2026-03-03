const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

exports.createPaymentOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId, amount, description } = req.body;

  const paymentOrder = await service.createPaymentOrder(
    orderId,
    userId,
    amount,
    description
  );

  return apiResponse.success(
    res,
    paymentOrder,
    "Payment order created successfully"
  );
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, gatewayPaymentId, signature } = req.body;

  const payment = await service.verifyPayment(
    orderId,
    gatewayPaymentId,
    signature
  );

  return apiResponse.success(res, payment, "Payment verified successfully");
});

exports.webhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.body.toString();
  const event = JSON.parse(rawBody);

  await service.processWebhook(event, signature, rawBody);

  return apiResponse.success(res, null, "Webhook processed successfully");
});

exports.getPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await service.getPaymentStatus(paymentId);

  return apiResponse.success(
    res,
    payment,
    "Payment status retrieved successfully"
  );
});

exports.createRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, speed, notes, receipt } = req.body;

  const refund = await service.processRefund(id, {
    amount,
    speed,
    notes,
    receipt,
  });

  return apiResponse.success(res, refund, "Refund processed successfully");
});
