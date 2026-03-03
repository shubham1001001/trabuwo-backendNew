const { Return } = require("./model");
const { OrderItem } = require("../order/model");
const { Order } = require("../order/model");
const { ProductVariant } = require("../product/model");
const { Product } = require("../product/model");

exports.createReturn = (data, options = {}) => Return.create(data, options);

exports.findReturnByPublicId = (publicId) =>
  Return.findOne({ where: { publicId } });

exports.findReturnsByBuyerId = (buyerId) =>
  Return.findAll({
    include: [
      {
        model: OrderItem,
        as: "orderItem",
        required: true,
        include: [
          {
            model: Order,
            as: "order",
            required: true,
            where: { buyerId },
            attributes: ["id", "publicId", "status", "totalAmount"],
          },
          {
            model: ProductVariant,
            as: "productVariant",
            required: true,
            include: [
              {
                model: Product,
                as: "product",
                required: true,
                attributes: ["id", "publicId", "name"],
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

exports.updateReturn = (id, data, options = {}) =>
  Return.update(data, { where: { id }, ...options });

exports.findReturnWithOrderItem = (returnId) =>
  Return.findByPk(returnId, {
    include: [
      {
        model: OrderItem,
        as: "orderItem",
        required: true,
        include: [
          {
            model: Order,
            as: "order",
            required: true,
            attributes: ["id", "publicId", "status", "totalAmount", "buyerId"],
          },
          {
            model: ProductVariant,
            as: "productVariant",
            required: true,
            include: [
              {
                model: Product,
                as: "product",
                required: true,
                attributes: ["id", "publicId", "name"],
              },
            ],
          },
        ],
      },
    ],
  });

exports.findActiveReturnByOrderItemId = (orderItemId) =>
  Return.findOne({
    where: {
      orderItemId,
      //   status: {
      //     [require("sequelize").Op.notIn]: ["refunded", "cancelled"],
      //   },
    },
  });
