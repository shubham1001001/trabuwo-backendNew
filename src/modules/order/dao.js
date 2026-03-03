const { Order, OrderItem } = require("./model");
const { Product, ProductImage, ProductVariant } = require("../product/model");
const { User } = require("../auth/model");
const { UserAddress } = require("../userAddress/model");
const { Location } = require("../sellerOnboarding/model");
const { Op, QueryTypes } = require("sequelize");
const sequelize = require("../../config/database");

const buildSellerCatalogueWhere = (sellerId) => ({
  [Op.and]: [
    sequelize.where(
      sequelize.col("items->productVariant->product.catalogue_id"),
      {
        [Op.in]: sequelize.literal(`(
          SELECT id FROM catalogues 
          WHERE user_id = ${sequelize.escape(sellerId)} 
          AND is_deleted = false
        )`),
      }
    ),
  ],
});

const itemsWithVariantProductImagesInclude = {
  model: OrderItem,
  as: "items",
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
          include: [{ model: ProductImage, as: "images" }],
        },
      ],
    },
  ],
};

exports.createOrder = (data, options = {}) => Order.create(data, options);

exports.createOrderItems = (items, options = {}) =>
  OrderItem.bulkCreate(items, options);

exports.getOrderItemById = (id, status) => {
  const where = { id };
  if (status) {
    where.status = status;
  }
  return OrderItem.findOne({ where });
};

exports.getOrderItemByPublicId = (publicId, status) => {
  return OrderItem.findOne({
    where: { publicId },
    include: [{ model: Order, as: "order", where: { status } }],
  });
};

exports.getOrderById = (id) =>
  Order.findByPk(id, {
    include: [
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
                include: [{ model: ProductImage, as: "images" }],
              },
            ],
          },
        ],
      },
      {
        model: User,
        as: "buyer",
        attributes: ["id", "email", "mobile"],
      },
      {
        model: User,
        as: "seller",
        attributes: ["id", "email", "mobile"],
      },
      {
        model: UserAddress,
        as: "buyerAddress",
        include: [
          {
            model: Location,
            as: "Location",
          },
        ],
      },
    ],
  });

exports.getOrdersBySellerId = (sellerId) =>
  Order.findAll({
    where: buildSellerCatalogueWhere(sellerId),
    include: [
      itemsWithVariantProductImagesInclude,
      { model: User, as: "buyer", attributes: ["email"] },
    ],
    order: [["createdAt", "DESC"]],
  });

exports.countBySellerId = async (sellerId) => {
  const rows = await sequelize.query(
    `
    SELECT COUNT(DISTINCT o.id) AS count
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    INNER JOIN product_variants pv ON pv.id = oi.product_variant_id AND pv.is_deleted = false
    INNER JOIN products p ON p.id = pv.product_id AND p.is_deleted = false
    INNER JOIN catalogues c ON c.id = p.catalogue_id AND c.is_deleted = false
    WHERE c.user_id = :sellerId
    `,
    { replacements: { sellerId }, type: QueryTypes.SELECT }
  );
  return parseInt(rows?.[0]?.count, 10) || 0;
};

exports.getOrdersBySellerIdWithFilters = async (sellerId, filters = {}) => {
  const whereClause = {};

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.slaStatus) {
    whereClause.slaStatus = filters.slaStatus;
  }

  if (filters.startDispatchDate || filters.endDispatchDate) {
    whereClause.dispatchDate = {};
    if (filters.startDispatchDate) {
      whereClause.dispatchDate[Op.gte] = new Date(filters.startDispatchDate);
    }
    if (filters.endDispatchDate) {
      whereClause.dispatchDate[Op.lte] = new Date(filters.endDispatchDate);
    }
  }

  if (filters.startSlaDate || filters.endSlaDate) {
    whereClause.slaDate = {};
    if (filters.startSlaDate) {
      whereClause.slaDate[Op.gte] = new Date(filters.startSlaDate);
    }
    if (filters.endSlaDate) {
      whereClause.slaDate[Op.lte] = new Date(filters.endSlaDate);
    }
  }

  const limit = filters.limit || 10;
  const offset = (filters.page - 1) * limit || 0;

  if ((filters.productName && filters.productName.trim()) || filters.skuId) {
    return handleProductSearch(sellerId, whereClause, filters, limit, offset);
  }

  return handleStandardQuery(sellerId, whereClause, limit, offset);
};

exports.getOrdersBySellerIdWithProductSearch = async (
  sellerId,
  filters = {}
) => {
  const whereClause = {};
  if (filters.status) {
    whereClause.status = filters.status;
  }

  const limit = filters.limit || 10;
  const offset = (filters.page - 1) * limit || 0;

  const includeClause = [
    {
      model: OrderItem,
      as: "items",
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
              include: [{ model: ProductImage, as: "images" }],
            },
          ],
        },
      ],
    },
  ];

  if (filters.productName && filters.productName.trim()) {
    const searchTerm = filters.productName.trim();

    // ✅ Count query
    const countResult = await sequelize.query(
      `
      SELECT COUNT(DISTINCT o.id) as count
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id
      INNER JOIN product_variants pv ON pv.id = oi.product_variant_id
      INNER JOIN products p ON p.id = pv.product_id
      INNER JOIN catalogues c ON c.id = p.catalogue_id
      WHERE c.user_id = :sellerId
      ${filters.status ? "AND o.status = :status" : ""}
      AND (
        p."search_vector" @@ plainto_tsquery('english', :searchTerm)
        OR similarity(p.name, :searchTerm) > 0.3
      )
      `,
      {
        replacements: {
          sellerId,
          searchTerm,
          ...(filters.status && { status: filters.status }),
        },
        type: QueryTypes.SELECT,
      }
    );

    const totalCount = parseInt(countResult[0].count, 10);

    // ✅ Fixed: include createdAt to avoid DISTINCT/ORDER BY error
    const orderIds = await sequelize.query(
      `
      SELECT DISTINCT o.id, o."createdAt"
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id
      INNER JOIN product_variants pv ON pv.id = oi.product_variant_id
      INNER JOIN products p ON p.id = pv.product_id
      INNER JOIN catalogues c ON c.id = p.catalogue_id
      WHERE c.user_id = :sellerId
      ${filters.status ? "AND o.status = :status" : ""}
      AND (
        p."search_vector" @@ plainto_tsquery('english', :searchTerm)
        OR similarity(p.name, :searchTerm) > 0.3
      )
      ORDER BY o."createdAt" DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: {
          sellerId,
          searchTerm,
          limit,
          offset,
          ...(filters.status && { status: filters.status }),
        },
        type: QueryTypes.SELECT,
      }
    );

    if (orderIds.length === 0) {
      return { count: 0, rows: [] };
    }

    const orderIdList = orderIds.map((row) => row.id);

    const orders = await Order.findAll({
      where: {
        id: { [Op.in]: orderIdList },
      },
      include: includeClause,
      order: [["createdAt", "DESC"]],
    });

    return {
      count: totalCount,
      rows: orders,
    };
  }

  try {
    return await Order.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });
  } catch {
    const count = await Order.count({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: "items",
          required: true,
          include: [
            {
              model: Product,
              as: "product",
              required: true,
            },
          ],
        },
      ],
      distinct: true,
    });

    const rows = await Order.findAll({
      where: whereClause,
      include: includeClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return { count, rows };
  }
};

exports.updateOrderStatus = (id, status) =>
  Order.update({ status }, { where: { id } });

exports.getOrderByIdForSeller = (id) =>
  Order.findOne({
    where: { publicId: id },
    include: [
      {
        model: OrderItem,
        as: "items",
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
                include: [{ model: ProductImage, as: "images" }],
              },
            ],
          },
        ],
      },
      {
        model: User,
        as: "buyer",
        attributes: ["id", "email", "mobile"],
      },
      {
        model: UserAddress,
        as: "buyerAddress",
        include: [
          {
            model: Location,
            as: "location",
            required: true,
          },
        ],
      },
    ],
  });

exports.getSellerDashboardStats = async (sellerId) => {
  const stockStats = await sequelize.query(
    `
    SELECT 
      COUNT(CASE WHEN pv.inventory = 0 THEN 1 END) AS "outOfStock",
      COUNT(CASE WHEN pv.inventory > 0 AND pv.inventory < 10 THEN 1 END) AS "lowStock"
    FROM products p
    INNER JOIN product_variants pv ON p.id = pv.product_id
    WHERE p.catalogue_id IN (
      SELECT id FROM catalogues 
      WHERE user_id = :sellerId 
      AND is_deleted = false
    )
    AND p.is_deleted = false
    AND pv.is_active = true 
    AND pv.is_deleted = false
    `,
    {
      replacements: { sellerId },
      type: QueryTypes.SELECT,
      raw: true,
    }
  );

  const orderStats = await sequelize.query(
    `
    SELECT 
      COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS "pending",
      COUNT(CASE WHEN o.status = 'ready_to_ship' THEN 1 END) AS "readyToShip"
    FROM orders o
    INNER JOIN order_items oi ON o.id = oi.order_id
    INNER JOIN product_variants pv ON oi.product_variant_id = pv.id
    INNER JOIN products p ON pv.product_id = p.id
    INNER JOIN catalogues c ON p.catalogue_id = c.id
    WHERE c.user_id = :sellerId
    AND c.is_deleted = false
    `,
    {
      replacements: { sellerId },
      type: QueryTypes.SELECT,
      raw: true,
    }
  );

  return {
    stock: {
      outOfStock: parseInt(stockStats[0]?.outOfStock) || 0,
      lowStock: parseInt(stockStats[0]?.lowStock) || 0,
    },
    orders: {
      pending: parseInt(orderStats[0]?.pending) || 0,
      readyToShip: parseInt(orderStats[0]?.readyToShip) || 0,
    },
  };
};

const handleProductSearch = async (
  sellerId,
  whereClause,
  filters,
  limit,
  offset
) => {
  // Build dynamic WHERE conditions for raw SQL (scope by seller via catalogue)
  let whereConditions = `c.user_id = :sellerId`;
  const replacements = { sellerId };

  // Build search condition based on filter type with AND logic
  let searchCondition = "";

  // Handle both productName and skuId simultaneously with AND logic
  if (filters.productName && filters.productName.trim() && filters.skuId) {
    // Both filters provided - use AND logic (both must match)
    searchCondition = `AND (
      (p."search_vector" @@ plainto_tsquery('english', :productName) OR similarity(p.name, :productName) > 0.3)
      AND p."skuId" = :skuId
    )`;
    replacements.productName = filters.productName.trim();
    replacements.skuId = filters.skuId;
  } else if (filters.productName && filters.productName.trim()) {
    // Only productName provided
    searchCondition = `AND (
      p."search_vector" @@ plainto_tsquery('english', :productName) OR similarity(p.name, :productName) > 0.3
    )`;
    replacements.productName = filters.productName.trim();
  } else if (filters.skuId) {
    // Only skuId provided - ensure exact match
    searchCondition = `AND p."skuId" = :skuId`;
    replacements.skuId = filters.skuId;
  }

  if (whereClause.status) {
    whereConditions += ` AND o.status = :status`;
    replacements.status = whereClause.status;
  }

  if (whereClause.slaStatus) {
    whereConditions += ` AND o."slaStatus" = :slaStatus`;
    replacements.slaStatus = whereClause.slaStatus;
  }

  if (whereClause.dispatchDate) {
    if (whereClause.dispatchDate[Op.gte]) {
      whereConditions += ` AND o."dispatchDate" >= :startDispatchDate`;
      replacements.startDispatchDate = whereClause.dispatchDate[Op.gte];
    }
    if (whereClause.dispatchDate[Op.lte]) {
      whereConditions += ` AND o."dispatchDate" <= :endDispatchDate`;
      replacements.endDispatchDate = whereClause.dispatchDate[Op.lte];
    }
  }

  if (whereClause.slaDate) {
    if (whereClause.slaDate[Op.gte]) {
      whereConditions += ` AND o."slaDate" >= :startSlaDate`;
      replacements.startSlaDate = whereClause.slaDate[Op.gte];
    }
    if (whereClause.slaDate[Op.lte]) {
      whereConditions += ` AND o."slaDate" <= :endSlaDate`;
      replacements.endSlaDate = whereClause.slaDate[Op.lte];
    }
  }

  // Test query to verify skuId filtering
  if (filters.skuId) {
    const testQuery = `
      SELECT p.id, p.name, p."skuId"
      FROM products p
      WHERE p."skuId" = :skuId
      LIMIT 5
    `;
    const testResult = await sequelize.query(testQuery, {
      replacements: { skuId: filters.skuId },
      type: QueryTypes.SELECT,
    });
    console.log("🔍 Test Query Result:", testResult);
  }

  // Count query - if this returns 0, we know no records match ALL filters
  const countQuery = `
    SELECT COUNT(DISTINCT o.id) as count
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    INNER JOIN product_variants pv ON pv.id = oi.product_variant_id
    INNER JOIN products p ON p.id = pv.product_id
    INNER JOIN catalogues c ON c.id = p.catalogue_id
    WHERE ${whereConditions}
    ${searchCondition}
  `;

  const countResult = await sequelize.query(countQuery, {
    replacements,
    type: QueryTypes.SELECT,
  });

  const totalCount = parseInt(countResult[0].count, 10);

  // If no records match ALL filters, return empty result immediately
  if (totalCount === 0) {
    console.log("🔍 No matches found, returning empty result");
    return {
      rows: [],
      count: 0,
    };
  }

  // Get order IDs with pagination
  const orderIdsQuery = `
    SELECT DISTINCT o.id, o."createdAt"
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    INNER JOIN product_variants pv ON pv.id = oi.product_variant_id
    INNER JOIN products p ON p.id = pv.product_id
    INNER JOIN catalogues c ON c.id = p.catalogue_id
    WHERE ${whereConditions}
    ${searchCondition}
    ORDER BY o."createdAt" DESC
    LIMIT :limit OFFSET :offset
  `;

  console.log("🔍 Order IDs Query:", orderIdsQuery);

  const orderIds = await sequelize.query(orderIdsQuery, {
    replacements: { ...replacements, limit, offset },
    type: QueryTypes.SELECT,
  });

  // Get full order data
  const orders = await Order.findAll({
    where: {
      id: { [Op.in]: orderIds.map((row) => row.id) },
    },
    include: [
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
                include: [{ model: ProductImage, as: "images" }],
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  console.log("🔍 Final orders count:", orders.length);

  return {
    rows: orders,
    count: totalCount,
  };
};

const handleStandardQuery = async (sellerId, whereClause, limit, offset) => {
  return Order.findAndCountAll({
    where: { ...whereClause, ...buildSellerCatalogueWhere(sellerId) },
    include: [itemsWithVariantProductImagesInclude],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    subQuery: false,
    distinct: true,
  });
};

exports.getOrdersStatsLast30Days = async (sellerId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await Order.findOne({
    attributes: [
      [sequelize.fn("COUNT", sequelize.col("id")), "orderCount"],
      [
        sequelize.fn(
          "COALESCE",
          sequelize.fn("SUM", sequelize.col("totalAmount")),
          0
        ),
        "totalSales",
      ],
    ],
    where: {
      sellerId: sellerId,
      createdAt: {
        [Op.gte]: thirtyDaysAgo,
      },
    },
    raw: true,
  });

  return {
    orderCount: parseInt(stats.orderCount) || 0,
    totalSales: parseFloat(stats.totalSales) || 0,
  };
};

exports.getOrdersByBuyerId = async (buyerId, filters = {}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  const includeClause = [
    {
      model: OrderItem,
      as: "items",
      required: false,
      attributes: ["publicId", "quantity", "price"],
      include: [
        {
          model: ProductVariant,
          as: "productVariant",
          required: false,
          attributes: ["publicId", "trabuwoPrice", "mrp", "dynamicFields"],
          include: [
            {
              model: Product,
              as: "product",
              required: false,
              attributes: ["publicId", "name", "description"],
              include: [
                {
                  model: ProductImage,
                  as: "images",
                  required: false,
                  where: { isDeleted: false },
                  attributes: [
                    "publicId",
                    "imageUrl",
                    "imageKey",
                    "altText",
                    "caption",
                    "sortOrder",
                    "isPrimary",
                  ],
                  order: [["sortOrder", "ASC"]],
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  return await Order.findAndCountAll({
    where: { buyerId },
    attributes: ["publicId", "status", "totalAmount", "createdAt"],
    include: includeClause,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });
};

exports.getOrderByIdForBuyer = (orderPublicId, buyerId) =>
  Order.findOne({
    where: { publicId: orderPublicId, buyerId },
    attributes: ["id", "publicId", "status", "totalAmount", "createdAt"],
    include: [
      {
        model: OrderItem,
        as: "items",
        required: false,
        attributes: ["publicId", "quantity", "price"],
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
            required: false,
            attributes: ["publicId", "trabuwoPrice", "mrp", "dynamicFields"],
            include: [
              {
                model: Product,
                as: "product",
                required: false,
                attributes: ["publicId", "name", "description"],
                include: [
                  {
                    model: ProductImage,
                    as: "images",
                    required: false,
                    where: { isDeleted: false },
                    attributes: [
                      "publicId",
                      "imageUrl",
                      "imageKey",
                      "altText",
                      "caption",
                      "sortOrder",
                      "isPrimary",
                    ],
                    order: [["sortOrder", "ASC"]],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        model: UserAddress,
        as: "buyerAddress",
        required: false,
        attributes: [
          "publicId",
          "name",
          "phoneNumber",
          "buildingNumber",
          "street",
          "landmark",
          "addressType",
          "isDefault",
        ],
        include: [
          {
            model: Location,
            as: "location",
            required: false,
            attributes: ["pincode", "city", "state"],
          },
        ],
      },
    ],
  });
