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

exports.initiateReturn = async (orderItemPublicId, buyerId, reason) => {
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

  if (order.status !== "shipped") {
    throw new ValidationError("Order must be shipped to initiate return");
  }

  const existingReturn = await dao.findActiveReturnByOrderItemId(orderItem.id);
  if (existingReturn) {
    throw new ValidationError(
      "An active return already exists for this order item"
    );
  }

  const returnRecord = await dao.createReturn({
    orderItemId: orderItem.id,
    status: "initiated",
    reason,
  });

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

    await paymentDao.updatePaymentStatusById(payment.id, "refunded", {
      refundedAt: new Date(),
    });
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
