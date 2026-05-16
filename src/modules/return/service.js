const dao = require("./dao");
const paymentDao = require("../payment/dao");
const shiprocketService = require("../shiprocket/service");
const paymentService = require("../payment/service");
const { NotFoundError, ValidationError } = require("../../utils/errors");
const { OrderItem } = require("../order/model");
const { UserAddress } = require("../userAddress/model");
const { Order } = require("../order/model");
const { User } = require("../auth/model");
const sequelize = require("../../config/database");
const configService = require("../platformConfig/service");
const trabuwoBalanceService = require("../trabuwoBalance/service");

exports.initiateReturn = async (orderItemPublicId, buyerId, reason, subreason, returnType = "customer_choice") => {
  const orderItem = await OrderItem.findOne({
    where: { publicId: orderItemPublicId },
    include: [
      {
        model: Order,
        as: "order",
        required: true,
        include: [
          {
            model: UserAddress,
            as: "buyerAddress",
            required: false,
          },
          {
            model: User,
            as: "buyer",
            required: false,
            attributes: ["id", "email", "mobile"],
          },
        ],
      },
      {
        model: require("../product/model").ProductVariant,
        as: "productVariant",
        required: true,
        include: [
          {
            model: require("../product/model").Product,
            as: "product",
            required: true,
            include: [
              {
                model: require("../catalogue/model"),
                as: "catalogue",
                required: true,
                include: [
                  {
                    model: require("../auth/model").User,
                    as: "seller",
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!orderItem) {
    throw new NotFoundError("Order item not found");
  }

  const order = orderItem.order;
  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.buyerId !== buyerId) {
    throw new ValidationError("You can only return items from your own orders");
  }

  // Check if status is either 'shipped' or 'delivered'
  if (!["shipped", "delivered"].includes(order.status)) {
    throw new ValidationError("Order must be shipped or delivered to initiate return");
  }

  const existingReturn = await dao.findActiveReturnByOrderItemId(orderItem.id);
  if (existingReturn) {
    throw new ValidationError(
      "An active return already exists for this order item"
    );
  }

  // ──────────────── Revenue Model: Cost Allocation ────────────────
  const returnShippingCost = await configService.getConfigValue("return_shipping_cost", 60);
  const maxFreeReturns = await configService.getConfigValue("max_free_returns_per_month", 2);
  
  let costBearer = "platform";
  
  if (returnType === "product_defect" || returnType === "wrong_product") {
    costBearer = "seller";
  } else {
    // Customer choice: Check free limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const usedFreeReturns = await dao.countReturnsByBuyerId(buyerId, {
      createdAt: { [sequelize.Sequelize.Op.gte]: startOfMonth },
      costBearer: "platform"
    });
    
    if (usedFreeReturns >= maxFreeReturns) {
      costBearer = "seller"; // Or buyer pays (charge from refund), Meesho usually charges seller or platform
      // For Trabuwo: If limit exceeded, seller bears it or we deduct from buyer's refund.
      // The requirement says "Platform pays reverse shipping" but "Max 2 per month".
      // Let's assume after 2, Seller pays.
    }
  }

  const returnRecord = await dao.createReturn({
    orderItemId: orderItem.id,
    status: "initiated",
    reason,
    subreason,
    returnType,
    returnShippingCost,
    costBearer,
    isRto: false
  });
  // ──────────────────────────────────────────────────────────────

  const returnOrderData = await shiprocketService.createReturnOrder(
    returnRecord.id,
    orderItem
  );

  await dao.updateReturn(returnRecord.id, {
    shiprocketReturnOrderId: returnOrderData.shiprocketReturnOrderId,
    returnAwbNumber: returnOrderData.returnAwbNumber,
    returnTrackingUrl: returnOrderData.returnTrackingUrl,
    status: "in_transit",
    metadata: returnOrderData.metadata || {},
  });

  return await dao.findReturnByPublicId(returnRecord.publicId);
};

exports.processRefund = async (returnId, sellerId) => {
  const returnRecord = await dao.findReturnWithOrderItem(returnId);

  if (!returnRecord) {
    throw new NotFoundError("Return not found");
  }

  const orderItem = returnRecord.orderItem;
  const order = orderItem.order;

  if (returnRecord.status !== "received") {
    throw new ValidationError(
      "Return must be in received status to process refund"
    );
  }

  const product = orderItem.productVariant.product;
  const Catalogue = require("../catalogue/model");
  const catalogue = await Catalogue.findByPk(product.catalogueId);

  if (!catalogue || catalogue.userId !== sellerId) {
    throw new ValidationError(
      "You can only process refunds for returns in your orders"
    );
  }

  const payment = await paymentDao.findPaymentByOrderPublicId(order.publicId);
  if (!payment) {
    throw new NotFoundError("Payment not found for this order");
  }

  if (payment.status !== "captured") {
    throw new ValidationError("Payment must be captured to process refund");
  }

  const refundAmount = Number(orderItem.price) * Number(orderItem.quantity);
  const refundAmountInPaise = Math.round(refundAmount * 100);

  const razorpayRefund = await paymentService.processRefund(
    payment.gatewayPaymentId,
    refundAmountInPaise,
    returnRecord.reason
  );

  await sequelize.transaction(async (t) => {
    // 1. Update Return Status
    await dao.updateReturn(
      returnRecord.id,
      {
        razorpayRefundId: razorpayRefund.id,
        refundedAt: new Date(),
        status: "refunded",
        metadata: {
          ...returnRecord.metadata,
          razorpayRefund: razorpayRefund,
        },
      },
      { transaction: t }
    );

    // 2. Update Payment Status
    await paymentDao.updatePaymentStatusById(payment.id, "refunded", {
      refundedAt: new Date(),
    }, { transaction: t });

    // 3. Adjust Wallets (Debit Seller/Reseller)
    const walletService = require("../wallet/service");
    await walletService.handleReturn(order.id, t);

    // 4. Credit buyer's Trabuwo balance
    await trabuwoBalanceService.creditBalance(
      order.buyerId,
      refundAmount,
      "return_refund",
      order.id,
      { transaction: t }
    );
  });

  return await dao.findReturnByPublicId(returnRecord.publicId);
};

exports.getReturnById = async (returnId, userId) => {
  const returnRecord = await dao.findReturnWithOrderItem(returnId);

  if (!returnRecord) {
    throw new NotFoundError("Return not found");
  }

  const order = returnRecord.orderItem.order;
  const product = returnRecord.orderItem.productVariant.product;
  const Catalogue = require("../catalogue/model");
  const catalogue = await Catalogue.findByPk(product.catalogueId);

  if (order.buyerId !== userId && (!catalogue || catalogue.userId !== userId)) {
    throw new ValidationError("You don't have access to this return");
  }

  return returnRecord;
};

exports.listReturns = async (userId, role) => {
  if (role === "buyer") {
    return await dao.findReturnsByBuyerId(userId);
  }

  const { Return } = require("./model");
  const { OrderItem } = require("../order/model");
  const { ProductVariant } = require("../product/model");
  const { Product } = require("../product/model");
  const Catalogue = require("../catalogue/model");

  return await Return.findAll({
    include: [
      {
        model: OrderItem,
        as: "orderItem",
        required: true,
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
            required: true,
            include: [
              {
                model: Product,
                as: "product",
                required: true,
                include: [
                  {
                    model: Catalogue,
                    as: "catalogue",
                    required: true,
                    where: { userId },
                    attributes: ["id", "publicId", "name"],
                  },
                ],
                attributes: ["id", "publicId", "name"],
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};
