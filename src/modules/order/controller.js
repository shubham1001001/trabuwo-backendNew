const service = require("./service");
const apiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

// exports.getSellerOrders = async (req, res) => {
//   const filters = {
//     status: req.query.status,
//     productName: req.query.productName,
//     skuId: req.query.skuId,
//     startDispatchDate: req.query.startDispatchDate,
//     endDispatchDate: req.query.endDispatchDate,
//     startSlaDate: req.query.startSlaDate,
//     endSlaDate: req.query.endSlaDate,
//     slaStatus: req.query.slaStatus,
//     page: req.query.page ? parseInt(req.query.page) : 1,
//     limit: req.query.limit ? parseInt(req.query.limit) : 10,
//   };

//   const result = await service.getOrdersBySellerIdWithFilters(
//     req.user.id,
//     filters
//   );

//   return apiResponse.success(res, {
//     orders: result.rows,
//     pagination: {
//       total: result.count,
//       page: filters.page,
//       limit: filters.limit,
//       totalPages: Math.ceil(result.count / filters.limit),
//     },
//   });
// };




exports.getSellerOrders = async (req, res) => {
const filters = {
  status: req.query.status,
  productName: req.query.productName,
  skuId: req.query.skuId,
  startDispatchDate: req.query.startDispatchDate,
  endDispatchDate: req.query.endDispatchDate,
  startSlaDate: req.query.startSlaDate,
  endSlaDate: req.query.endSlaDate,
  slaStatus: req.query.slaStatus,
  startOrderDate: req.query.startOrderDate
    ? new Date(req.query.startOrderDate)
    : undefined,
  endOrderDate: req.query.endOrderDate
    ? new Date(req.query.endOrderDate)
    : undefined,
  page: Number.isInteger(Number(req.query.page)) ? Number(req.query.page) : 1,
  limit: Number.isInteger(Number(req.query.limit)) ? Number(req.query.limit) : 10,
};
  const result = await service.getOrdersBySellerIdWithFilters(
    req.user.id,
    filters
  );

  return apiResponse.success(res, {
    orders: result.rows,
    pagination: {
      total: result.count,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(result.count / filters.limit),
    },
  });
};
exports.getSellerOrderById = async (req, res) => {
  const order = await service.getOrderByIdForSeller(req.params.id, req.user.id);
  return apiResponse.success(res, order);
};

exports.acceptOrder = async (req, res) => {
  const orderPublicId = req.params.orderPublicId;
  const result = await service.acceptOrder(orderPublicId, req.user.id);
  const responseData = {
    orderPublicId: result.order.publicId,
    status: result.order.status,
    shipment: {
      shipmentId: result.shipment.shipmentId,
      awbCode: result.shipment.awbNumber,
      courierCompanyName: result.shipment.courierName,
      pickupLocation: "HomeNew",
    },
  };
  return apiResponse.success(
    res,
    responseData,
    "Order accepted and shipment created successfully"
  );
};

exports.cancelOrder = async (req, res) => {
  const order = await service.cancelOrder(req.params.id, req.user.id);
  return apiResponse.success(res, order, "Order cancelled successfully");
};

exports.downloadShippingLabel = async (req, res) => {
  const shippingLabel = await service.downloadShippingLabel(
    req.params.id,
    req.user.id
  );
  return apiResponse.success(res, shippingLabel, "Shipping label generated");
};

exports.getSellerDashboard = async (req, res) => {
  const dashboardData = await service.getSellerDashboardData(req.user.id);
  return apiResponse.success(res, dashboardData);
};

exports.getOrdersStatsLast30Days = async (req, res) => {
  const stats = await service.getOrdersStatsLast30Days(req.user.id);
  return apiResponse.success(
    res,
    stats,
    "Order statistics retrieved successfully"
  );
};

exports.checkout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { userAddressPublicId } = req.body;
  const result = await service.checkoutCart(userId, userAddressPublicId);
  return apiResponse.success(res, result, "Checkout initiated successfully");
});

exports.buyNow = async (req, res) => {
  const userId = req.user.id;
  const { productVariantId, userAddressPublicId, quantity } = req.body;

  const result = await service.buyNow(userId, {
    productVariantId,
    userAddressPublicId,
    quantity: parseInt(quantity, 10),
  });

  return apiResponse.success(res, result, "Buy now initiated successfully");
};

exports.getBuyerOrders = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page ? parseInt(req.query.page) : 1,
    limit: req.query.limit ? parseInt(req.query.limit) : 10,
  };

  const result = await service.getOrdersByBuyerId(req.user.id, filters);

  return apiResponse.success(res, result);
});

exports.getBuyerOrderById = asyncHandler(async (req, res) => {
  const order = await service.getOrderByIdForBuyer(req.params.id, req.user.id);
  return apiResponse.success(res, order);
});
