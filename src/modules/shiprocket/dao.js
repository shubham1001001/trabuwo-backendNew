const { Shipment, ShiprocketWebhookScan } = require("./model");
const { Order, OrderItem } = require("../order/model");
const { User } = require("../auth/model");
const { Location } = require("../sellerOnboarding/model");
const { UserAddress } = require("../userAddress/model");
const { Product, ProductVariant } = require("../product/model");
const Catalogue = require("../catalogue/model");
const { Sequelize } = require("sequelize");
const sequelize = require("../../config/database");

exports.createShipment = (data, options = {}) => Shipment.create(data, options);

exports.findShipmentById = (shipmentId) => Shipment.findByPk(shipmentId);

exports.findShipmentByPublicId = (publicId) =>
  Shipment.findOne({ where: { publicId } });

exports.findShipmentByOrderId = (orderId) =>
  Shipment.findOne({ where: { orderId } });

exports.findShipmentByShiprocketOrderId = (shiprocketOrderId) =>
  Shipment.findOne({ where: { shiprocketOrderId } });

exports.findShipmentByAwbNumber = (awbNumber) =>
  Shipment.findOne({ where: { awbNumber } });

exports.findShipmentByAwbNumberOrShiprocketOrderId = (
  awbNumber,
  shiprocketOrderId
) =>
  Shipment.findOne({
    where: {
      [Sequelize.Op.or]: [{ awbNumber }, { shiprocketOrderId }],
    },
  });

exports.updateShipment = (shipmentId, data) =>
  Shipment.update(data, { where: { id: shipmentId } });

exports.updateShipmentByOrderId = (orderId, data) =>
  Shipment.update(data, { where: { orderId } });

exports.getShipmentWithOrder = (shipmentId) =>
  Shipment.findByPk(shipmentId, {
    include: [
      {
        model: Order,
        as: "order",
        include: [
          {
            model: UserAddress,
            as: "buyerAddress",
            include: [{ model: Location, as: "location" }],
          },
        ],
      },
      {
        model: User,
        as: "seller",
        attributes: ["id", "name", "email", "mobile"],
      },
    ],
  });

exports.getOrderWithDetails = (orderId) =>
  Order.findByPk(orderId, {
    include: [
      {
        model: UserAddress,
        as: "buyerAddress",
        include: [{ model: Location, as: "location" }],
      },
      {
        model: User,
        as: "buyer",
        attributes: ["id", "email", "mobile"],
      },
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "name", "styleCode", "weightInGram"],
              },
            ],
          },
        ],
      },
    ],
  });

exports.getShipmentsBySeller = (sellerId, options = {}) => {
  const { limit = 10, offset = 0, status } = options;

  const whereClause = { sellerId };
  if (status) {
    whereClause.status = status;
  }

  return Shipment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Order,
        as: "order",
        attributes: ["id", "totalAmount", "status"],
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
};

exports.getAllShipments = (options = {}) => {
  const { limit = 10, offset = 0, status, sellerId } = options;

  const whereClause = {};
  if (status) {
    whereClause.status = status;
  }
  if (sellerId) {
    whereClause.sellerId = sellerId;
  }

  return Shipment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Order,
        as: "order",
        attributes: ["id", "totalAmount", "status"],
      },
      {
        model: User,
        as: "seller",
        attributes: ["id", "name", "email"],
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
};

exports.deleteShipment = (shipmentId) =>
  Shipment.destroy({ where: { id: shipmentId } });

exports.getShipmentStats = async (sellerId = null) => {
  const whereClause = sellerId ? { sellerId } : {};

  const stats = await Shipment.findAll({
    where: whereClause,
    attributes: [
      "status",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  return stats.reduce((acc, stat) => {
    acc[stat.status] = parseInt(stat.count);
    return acc;
  }, {});
};

exports.getOrderItemWithFullDetailsForReturn = (orderItemId) =>
  OrderItem.findByPk(orderItemId, {
    include: [
      {
        model: Order,
        as: "order",
        required: true,
        include: [
          {
            model: UserAddress,
            as: "buyerAddress",
            required: true,
            include: [
              {
                model: Location,
                as: "location",
                required: true,
              },
            ],
          },
          {
            model: User,
            as: "buyer",
            required: true,
            attributes: ["id", "email", "mobile"],
          },
          {
            model: Shipment,
            as: "shipment",
            required: true,
            attributes: ["id", "shiprocketOrderId", "dimensions"],
          },
        ],
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
            include: [
              {
                model: Catalogue,
                as: "catalogue",
                required: true,
                include: [
                  {
                    model: User,
                    as: "seller",
                    required: true,
                    attributes: ["id", "email", "mobile"],
                  },
                ],
              },
            ],
            attributes: [
              "id",
              "name",
              "styleCode",
              "weightInGram",
              "catalogueId",
            ],
          },
        ],
      },
    ],
  });

exports.getOrderItemWithFullDetailsForExchange = (orderItemPublicId) =>
  OrderItem.findOne({
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
            required: true,
            include: [
              {
                model: Location,
                as: "location",
                required: true,
              },
            ],
          },
          {
            model: User,
            as: "buyer",
            required: true,
            attributes: ["id", "email", "mobile", "name"],
          },
          {
            model: Shipment,
            as: "shipment",
            required: false,
            attributes: ["id", "shiprocketOrderId", "dimensions"],
          },
        ],
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
            include: [
              {
                model: Catalogue,
                as: "catalogue",
                required: true,
                include: [
                  {
                    model: User,
                    as: "seller",
                    required: true,
                    attributes: ["id", "email", "mobile"],
                  },
                ],
              },
            ],
            attributes: [
              "id",
              "name",
              "styleCode",
              "weightInGram",
              "catalogueId",
            ],
          },
        ],
      },
    ],
  });

exports.updateShipmentFromWebhookRaw = async (
  shipmentId,
  webhookData,
  webhookTimestamp,
  transaction
) => {
  const sql = `
    UPDATE shipments 
    SET current_status = $1,
        current_status_id = $2,
        shipment_status = $3,
        shipment_status_id = $4,
        "current_timestamp" = $5,
        etd = $6,
        channel_order_id = $7,
        channel = $8,
        awb_number = $9,
        courier_name = $10,
        shiprocket_order_id = $11,
        metadata = $12
    WHERE id = $13 
      AND ("current_timestamp" IS NULL OR "current_timestamp" < $5)
  `;

  const bindValues = [
    webhookData.current_status || null,
    webhookData.current_status_id || null,
    webhookData.shipment_status || null,
    webhookData.shipment_status_id || null,
    webhookTimestamp ? new Date(webhookTimestamp) : null,
    webhookData.etd ? new Date(webhookData.etd) : null,
    webhookData.channel_order_id || null,
    webhookData.channel || null,
    webhookData.awb || null,
    webhookData.courier_name || null,
    webhookData.order_id || null,
    JSON.stringify(webhookData.metadata || {}),
    shipmentId,
  ];

  await sequelize.query(sql, {
    bind: bindValues,
    transaction,
  });
};

exports.upsertWebhookScans = async (shipmentId, scansData, transaction) => {
  if (!scansData || scansData.length === 0) {
    return;
  }

  const valuesPlaceholders = [];
  const bindValues = [];

  scansData.forEach((scan, index) => {
    const baseIndex = index * 4;
    valuesPlaceholders.push(
      `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${
        baseIndex + 4
      })`
    );
    bindValues.push(
      shipmentId,
      scan.date ? new Date(scan.date) : null,
      scan.activity || null,
      scan.location || null
    );
  });

  const sql = `
    INSERT INTO shiprocket_webhook_scans (shipment_id, date, activity, location)
    VALUES ${valuesPlaceholders.join(", ")}
    ON CONFLICT (shipment_id, date, activity) DO NOTHING
  `;

  await sequelize.query(sql, {
    bind: bindValues,
    transaction,
  });
};

exports.processWebhookData = async (shipmentId, webhookData, scansData) => {
  return await sequelize.transaction(async (t) => {
    const webhookTimestamp = webhookData.current_timestamp
      ? new Date(webhookData.current_timestamp)
      : null;

    await exports.updateShipmentFromWebhookRaw(
      shipmentId,
      webhookData,
      webhookTimestamp,
      t
    );

    await exports.upsertWebhookScans(shipmentId, scansData, t);
  });
};

exports.getShipmentWithWebhookScans = (shipmentId) =>
  Shipment.findByPk(shipmentId, {
    include: [
      {
        model: ShiprocketWebhookScan,
        as: "webhookScans",
        required: false,
        order: [["date", "DESC"]],
      },
    ],
  });
