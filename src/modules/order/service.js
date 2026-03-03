const dao = require("./dao");
const { NotFoundError, ValidationError } = require("../../utils/errors");
const cartDao = require("../cart/dao");
const productDao = require("../product/dao");
const userAddressDao = require("../userAddress/dao");
const paymentService = require("../payment/service");
const paymentDao = require("../payment/dao");
const shiprocketService = require("../shiprocket/service");
const shiprocketDao = require("../shiprocket/dao");
const sellerOnboardingService = require("../sellerOnboarding/service");
const { User } = require("../auth/model");
const { Order: OrderModel } = require("./model");
const { Shipment } = require("../shiprocket/model");
const sequelize = require("../../config/database");
exports.getOrdersBySellerId = async (sellerId) => {
  return dao.getOrdersBySellerId(sellerId);
};

exports.getOrdersBySellerIdWithFilters = async (sellerId, filters = {}) => {
  return dao.getOrdersBySellerIdWithFilters(sellerId, filters);
};

exports.getOrderByIdForSeller = async (orderId, sellerId) => {
  const order = await dao.getOrderByIdForSeller(orderId, sellerId);
  if (!order) {
    throw new NotFoundError("Order not found");
  }
  return order;
};

exports.acceptOrder = async (orderId, sellerId) => {
  const order = await dao.getOrderByIdForSeller(orderId, sellerId);
  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.status !== "pending") {
    throw new ValidationError(
      "Order can only be accepted when status is pending"
    );
  }

  console.log("order", order.toJSON());

  if (!order.buyerAddress || !order.buyerAddress.location) {
    throw new ValidationError("Buyer address with location is required");
  }

  if (!order.items || order.items.length === 0) {
    throw new ValidationError("Order must have at least one item");
  }

  const existingShipment = await shiprocketDao.findShipmentByOrderId(order.id);
  if (existingShipment) {
    throw new ValidationError("Shipment already exists for this order");
  }

  const seller = await User.findByPk(sellerId, {
    attributes: ["id", "email", "mobile"],
  });
  if (!seller) {
    throw new NotFoundError("Seller not found");
  }

  const sellerOnboarding =
    await sellerOnboardingService.getSellerOnboardingByUserId(sellerId);
  if (!sellerOnboarding) {
    throw new NotFoundError("Seller onboarding not found");
  }

  const sellerAddress =
    await sellerOnboardingService.getAddressBySellerOnboardingId(
      sellerOnboarding.id
    );
  if (!sellerAddress) {
    throw new NotFoundError("Seller address not found");
  }

  const sellerStore = await sellerOnboardingService.getStoresByOnboardingId(
    sellerOnboarding.id
  );
  if (!sellerStore) {
    throw new NotFoundError("Seller store not found");
  }

  const payment = await paymentDao.findPaymentByOrderPublicId(orderId);
  const paymentMethod = payment?.paymentMethod === "COD" ? "COD" : "Prepaid";

  const buyerAddress = order.buyerAddress;
  const buyerLocation = buyerAddress.location;
  const buyer = order.buyer;
  const buyerPhoneNumber = buyerAddress.phoneNumber || buyer?.mobile;
  const buyerEmail = buyer?.email;

  if (!buyerPhoneNumber) {
    throw new ValidationError("Buyer phone number is required");
  }

  if (!buyerEmail) {
    throw new ValidationError("Buyer email is required");
  }

  const buyerNameParts = (buyerAddress.name || buyerEmail).split(" ");
  const buyerFirstName = buyerNameParts[0] || "";
  const buyerLastName = buyerNameParts.slice(1).join(" ") || "";

  const orderItems = order.items.map((item) => {
    const product = item.productVariant?.product;
    return {
      name: product?.name || "",
      sku:
        item.productVariant?.skuId ||
        product?.styleCode ||
        `SKU-${product?.id}`,
      units: item.quantity,
      selling_price: parseFloat(item.price),
    };
  });

  const totalWeight = order.items.reduce((sum, item) => {
    const product = item.productVariant?.product;
    const weightInGram = product?.weightInGram || 1;
    return sum + (weightInGram * item.quantity) / 1000;
  }, 0);

  if (!sellerAddress.Location) {
    throw new NotFoundError("Seller location not found");
  }
  // const sellerLocation = sellerAddress.Location;

  const shiprocketPayload = {
    order_id: order.publicId,
    order_date: order.createdAt
      .toISOString()
      .replace("T", " ")
      .substring(0, 19),
    // channel_id: "27202",
    billing_customer_name: buyerFirstName,
    billing_last_name: buyerLastName,
    billing_address: `${buyerAddress.buildingNumber || ""} ${
      buyerAddress.street || ""
    }`.trim(),
    billing_city: buyerLocation.city,
    billing_pincode: parseInt(buyerLocation.pincode),
    billing_state: buyerLocation.state,
    billing_country: "India",
    billing_email: buyerEmail,
    billing_phone: parseInt(buyerPhoneNumber.replace(/\D/g, "").slice(-10)),
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: paymentMethod,
    sub_total: parseFloat(order.totalAmount),
    length: 1,
    breadth: 1,
    height: 1,
    weight: totalWeight || 0.5,
    pickup_location: "Jammu",
  };

  console.log("shiprocketPayload", shiprocketPayload);

  const shiprocketResponse = await shiprocketService.createForwardShipment(
    shiprocketPayload
  );

  console.log("shiprocketResponse", shiprocketResponse);

  const shipmentData = {
    orderId: order.id,
    sellerId: sellerId,
    shiprocketOrderId: shiprocketResponse.order_id?.toString() || null,
    shipmentId: shiprocketResponse.shipment_id?.toString() || null,
    status: "confirmed",
    awbNumber: shiprocketResponse.awb_code || null,
    courierId: shiprocketResponse.courier_company_id || null,
    courierName: shiprocketResponse.courier_name || null,
    labelUrl: shiprocketResponse.label_url || null,
    trackingUrl: shiprocketResponse.manifest_url || null,
    weight: shiprocketResponse.applied_weight || null,
    pickupScheduledDate: shiprocketResponse.pickup_scheduled_date || null,
    metadata: {
      pickup_token_number: shiprocketResponse.pickup_token_number || null,
      routing_code: shiprocketResponse.routing_code || null,
      rto_routing_code: shiprocketResponse.rto_routing_code || null,
      trabuwoOrderId: shiprocketResponse.channel_order_id || null,
    },
  };
  console.log("shipmentData", shipmentData);

  return await sequelize.transaction(async (t) => {
    await OrderModel.update(
      { status: "ready_to_ship" },
      { where: { id: order.id }, transaction: t }
    );
    const shipment = await shiprocketDao.createShipment(shipmentData, {
      transaction: t,
    });
    const updatedOrder = await dao.getOrderByIdForSeller(orderId);
    return { order: updatedOrder, shipment };
  });
};

exports.cancelOrder = async (orderId, sellerId) => {
  const order = await dao.getOrderByIdForSeller(orderId, sellerId);
  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.status === "shipped" || order.status === "cancelled") {
    throw new ValidationError(
      "Order cannot be cancelled when already shipped or cancelled"
    );
  }

  const shipment = await shiprocketDao.findShipmentByOrderId(order.id);

  if (shipment && shipment.shiprocketOrderId) {
    try {
      await shiprocketService.cancelOrdersByIds([shipment.shiprocketOrderId]);

      return await sequelize.transaction(async (t) => {
        await OrderModel.update(
          { status: "cancelled" },
          { where: { id: order.id }, transaction: t }
        );
        await Shipment.update(
          { status: "cancelled" },
          { where: { id: shipment.id }, transaction: t }
        );
        const updatedOrder = await dao.getOrderByIdForSeller(orderId, sellerId);
        return updatedOrder;
      });
    } catch (error) {
      console.error("Failed to cancel order in Shiprocket:", error);
    }
  }

  await dao.updateOrderStatus(order.id, "cancelled");
  return dao.getOrderByIdForSeller(orderId, sellerId);
};

exports.downloadShippingLabel = async (orderId, sellerId) => {
  const order = await dao.getOrderByIdForSeller(orderId, sellerId);
  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.status !== "ready_to_ship") {
    throw new ValidationError(
      "Shipping label can only be downloaded when order is ready to ship"
    );
  }

  // Update status to shipped when label is downloaded
  await dao.updateOrderStatus(orderId, "shipped");

  // Generate shipping label data (mock implementation)
  const shippingLabel = {
    orderId: order.id,
    buyerName: order.buyer.email || order.buyer.mobile,
    shippingAddress: {
      buildingNumber: order.buyerAddress.buildingNumber,
      street: order.buyerAddress.street,
      landmark: order.buyerAddress.landmark,
      pincode: order.buyerAddress.Location.pincode,
      city: order.buyerAddress.Location.city,
      state: order.buyerAddress.Location.state,
    },
    items: order.items.map((item) => ({
      productName: item.product.name,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: order.totalAmount,
    trackingNumber: `TRK-${order.id.slice(0, 8).toUpperCase()}`,
    downloadUrl: `https://api.example.com/shipping-labels/${order.id}.pdf`,
  };

  return shippingLabel;
};

exports.getSellerDashboardData = async (sellerId) => {
  return dao.getSellerDashboardStats(sellerId);
};

exports.getOrdersStatsLast30Days = async (sellerId) => {
  return dao.getOrdersStatsLast30Days(sellerId);
};

exports.checkoutCart = async (userId, userAddressPublicId) => {
  const cart = await cartDao.findCartByUserId(userId, "active");
  if (!cart) {
    throw new NotFoundError("Cart not found");
  }
  if (!cart.items || cart.items.length === 0) {
    throw new ValidationError("Cart is empty");
  }

  const userAddress = await userAddressDao.getUserAddressById(
    userAddressPublicId
  );
  if (!userAddress || userAddress.userId !== userId) {
    throw new ValidationError("Invalid user address");
  }

  const itemsSnapshot = cart.items.map((item) => {
    const unitPrice = Number(item.productVariant?.trabuwoPrice);
    return {
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      price: unitPrice,
    };
  });

  const totalAmount = itemsSnapshot.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const result = await sequelize.transaction(async (t) => {
    const order = await dao.createOrder(
      {
        buyerId: userId,
        status: "pending",
        totalAmount,
        buyerAddressId: userAddress.id,
      },
      { transaction: t }
    );

    const orderItemsPayload = itemsSnapshot.map((i) => ({
      orderId: order.id,
      productVariantId: i.productVariantId,
      quantity: i.quantity,
      price: i.price,
    }));
    await dao.createOrderItems(orderItemsPayload, { transaction: t });

    await cartDao.updateCart(cart.id, { status: "converted" });

    const payment = await paymentService.createPaymentOrder(
      order.id,
      userId,
      totalAmount,
      "Checkout",
      { transaction: t }
    );

    return { order, payment };
  });

  const { order, payment } = result;

  return {
    orderId: order.publicId,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    items: itemsSnapshot.map((i) => ({
      productVariantId: i.productVariantId,
      quantity: i.quantity,
      price: i.price,
    })),
    payment,
  };
};

exports.buyNow = async (userId, payload) => {
  const { productVariantId, userAddressPublicId, quantity } = payload;

  const variant = await productDao.getVariantByPublicId(productVariantId);
  if (!variant || variant.isDeleted || !variant.isActive) {
    throw new NotFoundError("Product variant not found");
  }

  if (variant.inventory < quantity) {
    throw new ValidationError("Insufficient inventory for selected variant");
  }

  const userAddress = await userAddressDao.getUserAddressById(
    userAddressPublicId
  );
  if (!userAddress || userAddress.userId !== userId) {
    throw new ValidationError("Invalid user address");
  }

  const unitPrice = Number(variant.trabuwoPrice);
  const totalAmount = unitPrice * quantity;

  const result = await sequelize.transaction(async (t) => {
    const order = await dao.createOrder(
      {
        buyerId: userId,
        status: "pending",
        totalAmount,
        buyerAddressId: userAddress.id,
      },
      { transaction: t }
    );

    const orderItem = {
      orderId: order.id,
      productVariantId: variant.id,
      quantity,
      price: unitPrice,
    };

    await dao.createOrderItems([orderItem], { transaction: t });

    const payment = await paymentService.createPaymentOrder(
      order.id,
      userId,
      totalAmount,
      "Buy Now",
      { transaction: t }
    );

    return { order, payment };
  });

  const { order, payment } = result;

  return {
    orderId: order.publicId,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    items: [
      {
        productVariantId,
        quantity,
        price: unitPrice,
      },
    ],
    payment,
  };
};

exports.getOrdersByBuyerId = async (buyerId, filters = {}) => {
  const result = await dao.getOrdersByBuyerId(buyerId, filters);

  return {
    orders: result.rows,
    pagination: {
      total: result.count,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(result.count / (filters.limit || 10)),
    },
  };
};

exports.getOrderByIdForBuyer = async (orderPublicId, buyerId) => {
  const order = await dao.getOrderByIdForBuyer(orderPublicId, buyerId);
  if (!order) {
    throw new NotFoundError("Order not found");
  }
  return order;
};
