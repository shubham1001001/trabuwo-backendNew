const config = require("config");
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
const productService = require("../product/service");
const walletService = require("../wallet/service");
const trabuwoBalanceService = require("../trabuwoBalance/service");
const configService = require("../platformConfig/service");

const getDynamicShippingRate = async (variantWithProduct, buyerPincode, isCod, builtInShippingFee) => {
  try {
    const sellerPincode = variantWithProduct?.product?.catalogue?.seller?.sellerOnboarding?.address?.[0]?.Location?.pincode;
    if (!sellerPincode || !buyerPincode) return builtInShippingFee;

    const weightInKg = (variantWithProduct?.product?.weightInGram || config.get("shiprocket.defaultWeight") * 1000 || 500) / 1000;

    const ratesData = await shiprocketService.calculateShippingRates({
      pickup_postcode: sellerPincode,
      delivery_postcode: String(buyerPincode),
      weight: weightInKg,
      cod: isCod ? 1 : 0,
    });

    const available = ratesData?.available_courier_companies || [];
    if (available.length === 0) return builtInShippingFee;

    available.sort((a, b) => Number(a.rate) - Number(b.rate));
    return Number(available[0].rate);
  } catch {
    return builtInShippingFee;
  }
};

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
  let buyerEmail = buyer?.email;

  if (!buyerPhoneNumber) {
    throw new ValidationError("Buyer phone number is required");
  }

  if (!buyerEmail) {
    // Shiprocket requires an email. If missing, use a placeholder based on phone
    console.warn(`Buyer email missing for order ${order.publicId}. Using placeholder.`);
    buyerEmail = `${buyerPhoneNumber.replace(/\D/g, "")}@trabuwo.com`;
  }

  const buyerNameParts = (buyerAddress.name || "Customer").split(" ");
  const buyerFirstName = buyerNameParts[0] || "Customer";
  const buyerLastName = buyerNameParts.slice(1).join(" ") || "User";

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
    billing_address: `${buyerAddress.buildingNumber || ""} ${buyerAddress.street || ""
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
    // Pickup location name must match the name registered in the seller's
    // Shiprocket account. It is derived the same way as in registerPickupLocation.
    pickup_location: config.get("shiprocket.pickupLocation") || (sellerStore?.email
      ? sellerStore.email.substring(0, 36)
      : "Primary"),
  };

  // Attempt Shiprocket — non-fatal if the external service is down
  let shiprocketResponse = null;
  let shiprocketError = null;
  try {
    shiprocketResponse = await shiprocketService.createForwardShipment(
      shiprocketPayload
    );
  } catch (err) {
    shiprocketError = err.message || "Shiprocket unavailable";
    console.warn(`[acceptOrder] Shiprocket failed for order ${order.publicId}:`, shiprocketError);
  }

  const shipmentData = {
    orderId: order.id,
    sellerId: sellerId,
    shiprocketOrderId: shiprocketResponse?.order_id?.toString() || null,
    shipmentId: shiprocketResponse?.shipment_id?.toString() || null,
    status: shiprocketResponse ? "confirmed" : "pending",
    awbNumber: shiprocketResponse?.awb_code || null,
    courierId: shiprocketResponse?.courier_company_id || null,
    courierName: shiprocketResponse?.courier_name || null,
    labelUrl: shiprocketResponse?.label_url || null,
    trackingUrl: shiprocketResponse?.manifest_url || null,
    weight: shiprocketResponse?.applied_weight || null,
    pickupScheduledDate: shiprocketResponse?.pickup_scheduled_date || null,
    metadata: {
      pickup_token_number: shiprocketResponse?.pickup_token_number || null,
      routing_code: shiprocketResponse?.routing_code || null,
      rto_routing_code: shiprocketResponse?.rto_routing_code || null,
      trabuwoOrderId: shiprocketResponse?.channel_order_id || null,
      shiprocketError: shiprocketError || null,
    },
  };

  return await sequelize.transaction(async (t) => {
    // Re-fetch and lock the order row to prevent concurrent acceptance
    const orderToUpdate = await OrderModel.findByPk(order.id, { 
      transaction: t,
      lock: t.LOCK.UPDATE 
    });

    if (!orderToUpdate) {
      throw new NotFoundError("Order not found");
    }

    if (orderToUpdate.status !== "pending") {
      throw new ValidationError(
        `Order cannot be accepted because its status is ${orderToUpdate.status}`
      );
    }

    await orderToUpdate.update(
      { status: "ready_to_ship" },
      { transaction: t }
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

  const result = await sequelize.transaction(async (t) => {
    // Restore inventory
    for (const item of order.items) {
      if (item.productVariantId) {
        await productService.incrementInventory(
          item.productVariantId,
          item.quantity,
          { transaction: t }
        );
      }
    }

    if (shipment && shipment.shiprocketOrderId) {
      try {
        await shiprocketService.cancelOrdersByIds([shipment.shiprocketOrderId]);
        await Shipment.update(
          { status: "cancelled" },
          { where: { id: shipment.id }, transaction: t }
        );
      } catch (error) {
        console.error("Failed to cancel order in Shiprocket:", error);
      }
    }

    await OrderModel.update(
      { status: "cancelled" },
      { where: { id: order.id }, transaction: t }
    );

    // Credit buyer's wallet for prepaid orders
    if (order.paymentMethod === "prepaid" && order.buyerId) {
      try {
        const payment = await paymentDao.findPaymentByOrderPublicId(order.publicId);
        if (payment && payment.status === "captured") {
          await walletService.refundToBuyerWallet(
            order.buyerId,
            Number(order.totalAmount),
            order.id,
            t
          );
        }
      } catch (err) {
        // Non-fatal: log but don't block the cancellation
        console.error("[cancelOrder] Failed to credit wallet balance:", err.message);
      }
    }

    const updatedOrder = await dao.getOrderByIdForSeller(orderId, sellerId);
    return updatedOrder;
  });

  return result;
};

exports.buyerCancelOrder = async (orderPublicId, buyerId, cancelDetails) => {
  const { reason, subreason, comments } = cancelDetails;
  
  // First get the order using buyer method to verify ownership
  const buyerOrder = await dao.getOrderByIdForBuyer(orderPublicId, buyerId);
  if (!buyerOrder) {
    throw new NotFoundError("Order not found");
  }

  if (buyerOrder.status === "shipped" || buyerOrder.status === "delivered" || buyerOrder.status === "cancelled") {
    throw new ValidationError(
      "Order cannot be cancelled at this stage"
    );
  }

  // Fetch full order for inventory restoration and wallet adjustments
  const order = await dao.getOrderById(buyerOrder.id);
  const shipment = await shiprocketDao.findShipmentByOrderId(order.id);

  const result = await sequelize.transaction(async (t) => {
    // 1. Restore inventory
    for (const item of order.items) {
      if (item.productVariantId) {
        await productService.incrementInventory(
          item.productVariantId,
          item.quantity,
          { transaction: t }
        );
      }
    }

    // 2. Cancel shipment if exists
    if (shipment && shipment.shiprocketOrderId) {
      try {
        await shiprocketService.cancelOrdersByIds([shipment.shiprocketOrderId]);
        await Shipment.update(
          { status: "cancelled" },
          { where: { id: shipment.id }, transaction: t }
        );
      } catch (error) {
        console.error("Failed to cancel order in Shiprocket:", error);
      }
    }

    // 3. Update order status and store cancellation details
    await OrderModel.update(
      { 
        status: "cancelled",
        cancelReason: reason,
        cancelSubreason: subreason,
        cancelComments: comments
      },
      { where: { id: order.id }, transaction: t }
    );

    // 4. Reverse seller/reseller pending earnings
    await walletService.handleReturn(order.id, t);

    // 5. Credit buyer's Trabuwo balance for prepaid orders
    if (order.paymentMethod === "prepaid" && order.buyerId) {
      try {
        const payment = await paymentDao.findPaymentByOrderPublicId(order.publicId);
        if (payment && payment.status === "captured") {
          await trabuwoBalanceService.creditBalance(
            order.buyerId,
            Number(order.totalAmount),
            "order_cancelled",
            order.id,
            { transaction: t }
          );
        }
      } catch (err) {
        console.error("[buyerCancelOrder] Failed to credit buyer balance:", err.message);
      }
    }

    const updatedOrder = await dao.getOrderByIdForBuyer(orderPublicId, buyerId);
    return updatedOrder;
  });

  return result;
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

  // Do NOT update order status here. The order transitions to "shipped" when
  // Shiprocket confirms pickup via the logistics webhook (shipment_status_id 6/13).
  const shipment = await shiprocketDao.findShipmentByOrderId(order.id);
  if (!shipment || !shipment.labelUrl) {
    throw new ValidationError(
      "Shipping label not yet available — Shiprocket has not generated it yet"
    );
  }

  return {
    orderId: order.publicId,
    labelUrl: shipment.labelUrl,
    awbNumber: shipment.awbNumber,
    courierName: shipment.courierName,
    trackingUrl: shipment.trackingUrl,
  };
};

exports.getSellerDashboardData = async (sellerId) => {
  return dao.getSellerDashboardStats(sellerId);
};

exports.getOrdersStatsLast30Days = async (sellerId) => {
  return dao.getOrdersStatsLast30Days(sellerId);
};
exports.checkoutCart = async (userId, userAddressPublicId, paymentMethod = "ONLINE") => {
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

  const [platformFee, codFee, pgPercentage, codPgCost, builtInShippingFee] = await Promise.all([
    configService.getPlatformFee(),
    configService.getCodFee(),
    configService.getPgCostPercentage(),
    configService.getCodPgCost(),
    configService.getBuiltInShippingFee()
  ]);

  const isCod = paymentMethod && paymentMethod.toUpperCase() === "COD";
  const buyerPincode = userAddress.location?.pincode || userAddress.Location?.pincode;

  // Re-validate inventory at checkout time — cart may have been created when stock
  // was available but another buyer may have purchased since then.
  for (const item of cart.items) {
    const currentInventory = item.productVariant?.inventory ?? 0;
    if (currentInventory < item.quantity) {
      const variantName = item.productVariant?.skuId || item.productVariantId;
      throw new ValidationError(
        `Item "${variantName}" is out of stock or has insufficient quantity. Available: ${currentInventory}`
      );
    }
  }

  const itemsSnapshot = await Promise.all(cart.items.map(async (item) => {
    // Fetch variant with seller info for dynamic shipping rate
    const variantWithProduct = await productDao.getVariantWithProduct(item.productVariantId);
    const actualLogisticsCost = await getDynamicShippingRate(variantWithProduct, buyerPincode, isCod, builtInShippingFee);

    const listingPrice = Number(item.productVariant?.trabuwoPrice || 0);
    const resellerPrice = item.resellerPrice ? Number(item.resellerPrice) : null;
    const resellerMargin = resellerPrice ? (resellerPrice - listingPrice) : 0;

    const categoryId = variantWithProduct?.product?.catalogue?.categoryId || variantWithProduct?.product?.categoryId;
    let commissionRate = 0.05;
    try {
      commissionRate = await configService.getCommissionRate(categoryId);
    } catch (err) {
      console.warn("Using default 5% commission:", err.message);
    }

    const commissionAmount = Number((listingPrice * commissionRate).toFixed(2));
    // Seller payout should deduct the inclusive logistics and platform fee
    const sellerPayout = Number((listingPrice - commissionAmount - (actualLogisticsCost || 0) - (platformFee || 15)).toFixed(2));

    const buyerProductPrice = resellerPrice || listingPrice;

    return {
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      price: Number(buyerProductPrice.toFixed(2)),
      listingPrice: Number(listingPrice.toFixed(2)),
      resellerPrice: resellerPrice ? Number(resellerPrice.toFixed(2)) : null,
      resellerMargin: Number(resellerMargin.toFixed(2)),
      commissionAmount: Number(commissionAmount.toFixed(2)),
      sellerPayout: Number(sellerPayout.toFixed(2)),
      logisticsCost: Number(actualLogisticsCost || 0),
    };
  }));

  const productSubtotal = itemsSnapshot.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  // Logistics and Platform fees are already inclusive in the listing price
  // The buyer should not pay them extra.
  const logisticsCost = itemsSnapshot.reduce((sum, i) => sum + i.logisticsCost, 0);
  const shippingMargin = 20; 
  const currentShippingFee = logisticsCost + shippingMargin;
  const currentPlatformFee = Number(platformFee || 15);
  const currentCodFee = isCod ? Number(codFee || 20) : 0;

  // Inclusive total: Buyer only pays the product price + COD fee (if applicable)
  const totalAmount = Number((productSubtotal + currentCodFee).toFixed(2));
  const pgCost = isCod ? Number(codPgCost || 0) : Number((totalAmount * (pgPercentage / 100)).toFixed(2));

  const result = await sequelize.transaction(async (t) => {
    const order = await dao.createOrder(
      {
        buyerId: userId,
        resellerId: cart.resellerId,
        status: isCod ? "pending" : "on_hold",
        totalAmount,
        buyerAddressId: userAddress.id,
        paymentMethod: isCod ? "cod" : "prepaid",
        shippingFee: currentShippingFee,
        platformFee: currentPlatformFee,
        codFee: currentCodFee,
        logisticsCost,
        pgCost,
        shippingMargin
      },
      { transaction: t }
    );

    const orderItemsPayload = itemsSnapshot.map((i) => ({
      orderId: order.id,
      productVariantId: i.productVariantId,
      quantity: i.quantity,
      price: i.price,
      listingPrice: i.listingPrice,
      resellerPrice: i.resellerPrice,
      resellerMargin: i.resellerMargin,
      commissionAmount: i.commissionAmount,
      sellerPayout: i.sellerPayout
    }));
    await dao.createOrderItems(orderItemsPayload, { transaction: t });

    await cartDao.updateCart(cart.id, { status: "converted" }, { transaction: t });

    let payment;
    if (isCod) {
      payment = await paymentDao.createPayment(
        {
          orderId: order.id,
          userId,
          paymentMethod: "COD",
          amount: totalAmount,
          status: "pending",
          description: "Checkout - COD",
        },
        { transaction: t }
      );
      // Finalize immediately for COD
      await exports.finalizeOrderAfterPayment(order.id, { transaction: t, isCod: true });
    } else {
      payment = await paymentService.createPaymentOrder(
        order.id,
        userId,
        totalAmount,
        "Checkout - Online",
        { transaction: t }
      );
    }

    return { order, payment };
  });

  const { order, payment } = result;

  // Credit wallets for COD after the checkout transaction commits.
  // For online, wallet credit is handled in finalizeOrderAfterPayment after
  // the payment verification transaction commits.
  if (isCod) {
    const orderWithItems = await dao.getOrderById(order.id);
    await walletService.creditOrderEarnings(orderWithItems);
  }

  return {
    orderId: order.publicId,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    shippingFee: currentShippingFee,
    platformFee: currentPlatformFee,
    codFee: currentCodFee,
    items: itemsSnapshot.map((i) => ({
      productVariantId: i.productVariantId,
      quantity: i.quantity,
      price: i.price,
    })),
    payment,
  };
};

exports.buyNow = async (userId, payload) => {
  const { productVariantId, userAddressPublicId, quantity, paymentMethod = "ONLINE" } = payload;

  console.log("🚀 BuyNow Step 1: Input", { userId, productVariantId, quantity, paymentMethod });
  const variant = await productDao.getVariantByPublicId(productVariantId);
  console.log("🚀 BuyNow Step 2: Variant found", variant?.id);
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

  const [platformFee, codFee, pgPercentage, codPgCost, builtInShippingFee] = await Promise.all([
    configService.getPlatformFee(),
    configService.getCodFee(),
    configService.getPgCostPercentage(),
    configService.getCodPgCost(),
    configService.getBuiltInShippingFee()
  ]);
  console.log("🚀 BuyNow Step 3: Configs loaded", { platformFee, codFee });

  const isCod = paymentMethod && paymentMethod.toUpperCase() === "COD";

  // Fetch variant with product+seller pincode for dynamic shipping
  const variantWithProduct = await productDao.getVariantWithProduct(variant.id);
  const buyerPincode = userAddress.location?.pincode || userAddress.Location?.pincode;
  const actualLogisticsCost = await getDynamicShippingRate(variantWithProduct, buyerPincode, isCod, builtInShippingFee);

  const listingPrice = Number(variant.trabuwoPrice || 0);
  const resellerPrice = payload.resellerPrice ? Number(payload.resellerPrice) : null;
  const resellerMargin = resellerPrice ? (resellerPrice - listingPrice) : 0;

  const logisticsCost = Number(actualLogisticsCost || 0);
  const shippingMargin = 20; // As per Document 14.1 (₹15-₹25 margin)
  const currentShippingFee = logisticsCost + shippingMargin;
  
  const currentPlatformFee = Number(platformFee || 15);
  const currentCodFee = isCod ? Number(codFee || 20) : 0;

  const categoryId = variantWithProduct?.product?.catalogue?.categoryId || variantWithProduct?.product?.categoryId;
  let commissionRate = 0.05;
  try {
    commissionRate = await configService.getCommissionRate(categoryId);
  } catch (err) {
    console.warn("Using default 5% commission:", err.message);
  }

  const commissionAmount = Number((listingPrice * commissionRate).toFixed(2));
  // Seller payout should deduct the inclusive logistics and platform fee
  const sellerPayout = Number((listingPrice - commissionAmount - logisticsCost - currentPlatformFee).toFixed(2));

  // Buyer Product Price is either RP (Reseller Price) or LP (Listing Price)
  const buyerProductPrice = resellerPrice || listingPrice;
  const productSubtotal = buyerProductPrice * quantity;
  
  // Inclusive total: Buyer only pays the product price + COD fee (if applicable)
  const totalAmount = Number((productSubtotal + currentCodFee).toFixed(2));

  const pgCost = isCod ? Number(codPgCost || 0) : Number((totalAmount * (pgPercentage / 100)).toFixed(2));

  console.log("🚀 BuyNow Step 4: Transaction starting", { totalAmount, isCod, sellerPayout, resellerMargin });

  const result = await sequelize.transaction(async (t) => {
    const order = await dao.createOrder(
      {
        buyerId: userId,
        resellerId: payload.resellerId || null,
        status: isCod ? "pending" : "on_hold",
        totalAmount,
        buyerAddressId: userAddress.id,
        paymentMethod: isCod ? "cod" : "prepaid",
        shippingFee: currentShippingFee,
        platformFee: currentPlatformFee,
        codFee: currentCodFee,
        logisticsCost,
        pgCost,
        shippingMargin
      },
      { transaction: t }
    );

    const orderItem = {
      orderId: order.id,
      productVariantId: variant.id,
      quantity: Number(quantity),
      price: Number(buyerProductPrice.toFixed(2)),
      listingPrice: Number(listingPrice.toFixed(2)),
      resellerPrice: resellerPrice ? Number(resellerPrice.toFixed(2)) : null,
      resellerMargin: Number(resellerMargin.toFixed(2)),
      commissionAmount: Number(commissionAmount.toFixed(2)),
      sellerPayout: Number(sellerPayout.toFixed(2))
    };

    await dao.createOrderItems([orderItem], { transaction: t });

    let payment;
    if (isCod) {
      payment = await paymentDao.createPayment(
        {
          orderId: order.id,
          userId,
          paymentMethod: "COD",
          amount: totalAmount,
          status: "pending",
          description: "Buy Now - COD",
        },
        { transaction: t }
      );
      console.log("🚀 BuyNow Step 6: Payment Created, Finalizing for COD");
      // Finalize immediately for COD
      await exports.finalizeOrderAfterPayment(order.id, { transaction: t, isCod: true });
    } else {
      payment = await paymentService.createPaymentOrder(
        order.id,
        userId,
        totalAmount,
        "Buy Now - Online",
        { transaction: t }
      );
    }

    return { order, payment };
  });

  const { order, payment } = result;

  // Credit wallets for COD after the checkout transaction commits.
  // For online, wallet credit is handled in finalizeOrderAfterPayment.
  if (isCod) {
    const orderWithItems = await dao.getOrderById(order.id);
    await walletService.creditOrderEarnings(orderWithItems);
  }

  return {
    orderId: order.publicId,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    shippingFee: currentShippingFee,
    platformFee: currentPlatformFee,
    codFee: currentCodFee,
    items: [
      {
        productVariantId,
        quantity,
        price: buyerProductPrice,
      },
    ],
    paymentMethod: order.paymentMethod,
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

exports.finalizeOrderAfterPayment = async (orderId, options = {}) => {
  const { transaction, isCod = false } = options;

  const order = await dao.getOrderById(orderId, { transaction });
  if (!order) {
    console.error(`[finalizeOrderAfterPayment] Order ${orderId} not found`);
    return;
  }

  // Idempotency guard for online orders: on_hold → pending on first run.
  // If the order is no longer on_hold, finalization already ran — skip to
  // prevent double inventory decrement when both verifyPayment and the
  // Razorpay webhook both trigger this function. COD orders bypass this
  // check because they start as "pending" from creation.
  if (!isCod && order.status !== "on_hold") {
    console.log(`[finalizeOrderAfterPayment] Already finalized for order ${orderId} (status: ${order.status}), skipping.`);
    return;
  }

  const processFinalization = async (t) => {
    for (const item of order.items) {
      if (item.productVariantId) {
        await productService.decrementInventory(
          item.productVariantId,
          item.quantity,
          { transaction: t }
        );
      }
    }

    await OrderModel.update(
      { status: "pending" },
      { where: { id: order.id }, transaction: t }
    );
  };

  if (transaction) {
    // Called within an outer transaction (COD checkout) — wallet credit is
    // handled by the caller after that transaction commits.
    await processFinalization(transaction);
  } else {
    // Online payment path — create own transaction, then credit wallets after
    // it commits so the wallet sees a fully committed order.
    await sequelize.transaction(async (t) => {
      await processFinalization(t);
    });

    try {
      const orderWithItems = await dao.getOrderById(orderId);
      if (orderWithItems) {
        await walletService.creditOrderEarnings(orderWithItems);
      }
    } catch (err) {
      console.error("[finalizeOrderAfterPayment] Failed to credit wallet earnings:", err.message);
    }
  }
};

exports.updateOrderAddress = async (orderPublicId, userId, shippingAddressId) => {
  const order = await dao.getOrderById(orderPublicId);
  if (!order) {
    const { NotFoundError } = require("../../utils/errors");
    throw new NotFoundError("Order not found");
  }
  
  if (order.buyerId !== userId) {
    const { ValidationError } = require("../../utils/errors");
    throw new ValidationError("You can only update your own orders");
  }

  if (order.status !== "pending") {
    const { ValidationError } = require("../../utils/errors");
    throw new ValidationError("Address can only be changed for pending orders");
  }

  // Verify address belongs to user
  const { UserAddress } = require("../userAddress/model");
  const address = await UserAddress.findOne({ where: { id: shippingAddressId, userId } });
  if (!address) {
    const { ValidationError } = require("../../utils/errors");
    throw new ValidationError("Invalid address selected");
  }

  await dao.updateOrder(order.id, { shippingAddressId });
  
  return await dao.getOrderByIdForBuyer(orderPublicId, userId);
};

exports.updateOrderItemVariant = async (orderItemPublicId, userId, newVariantId) => {
  const orderItem = await dao.getOrderItemByPublicId(orderItemPublicId, "pending");
  if (!orderItem) {
    const { NotFoundError } = require("../../utils/errors");
    throw new NotFoundError("Order item not found or order not in pending status");
  }

  const order = orderItem.order;
  if (order.buyerId !== userId) {
    const { ValidationError } = require("../../utils/errors");
    throw new ValidationError("Unauthorized");
  }

  // Check if new variant exists and belongs to same product
  const { ProductVariant } = require("../product/model");
  const newVariant = await ProductVariant.findByPk(newVariantId);
  if (!newVariant) {
    const { ValidationError } = require("../../utils/errors");
    throw new ValidationError("New variant not found");
  }

  const currentVariant = await ProductVariant.findByPk(orderItem.productVariantId);
  if (newVariant.productId !== currentVariant.productId) {
    const { ValidationError } = require("../../utils/errors");
    throw new ValidationError("You can only change to a variant of the same product");
  }

  // Check inventory
  if (newVariant.inventory < orderItem.quantity) {
    const { ValidationError } = require("../../utils/errors");
    throw new ValidationError("Requested variant is out of stock");
  }

  // Note: Price might be different. In a real app, we might need to handle price difference.
  // For now, let's assume price must be same or we just update it.
  
  await orderItem.update({ productVariantId: newVariantId });
  
  return await dao.getOrderByIdForBuyer(order.publicId, userId);
};
