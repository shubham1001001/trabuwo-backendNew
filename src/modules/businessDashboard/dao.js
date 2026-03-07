const { Op, fn, col } = require("sequelize");
const { ProductMetricsDaily } = require("./model");
const { Product, ProductImage } = require("../product/model");
const Catalogue = require("../catalogue/model");
const { User ,Role } = require("../auth/model");
const { SellerOnboarding, Store } = require("../sellerOnboarding/model");
const { Order,OrderItem } = require("../order/model");
const { ProductVariant } = require("../product/model"); 
const { UserAddress } = require("../userAddress/model");
const { Payment, Refund } = require("../payment/model");
const sequelize = require("../../config/database");

async function aggregateMetricsForProducts(productIds, startDate, endDate) {
  const rows = await ProductMetricsDaily.findAll({
    attributes: [
      "productId",
      [fn("SUM", col("views")), "views"],
      [fn("SUM", col("clicks")), "clicks"],
      [fn("SUM", col("orders")), "orders"],
      [fn("SUM", col("sales_amount")), "salesAmount"],
      [fn("AVG", col("avg_rating")), "avgRating"],
    ],
    where: {
      productId: { [Op.in]: productIds },
      date: { [Op.between]: [startDate, endDate] },
    },
    group: ["productId"],
    raw: true,
  });

  return rows.reduce((acc, row) => {
    acc[row.productId] = {
      views: Number(row.views) || 0,
      clicks: Number(row.clicks) || 0,
      orders: Number(row.orders) || 0,
      salesAmount: Number(row.salesAmount) || 0,
      avgRating: Number(row.avgRating) || 0,
    };
    return acc;
  }, {});
}

function calcPercentageChange(current, previous) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}

function calculatePercentageChanges(current, previous) {
  return {
    views: calcPercentageChange(current.views, previous.views),
    clicks: calcPercentageChange(current.clicks, previous.clicks),
    orders: calcPercentageChange(current.orders, previous.orders),
    salesAmount: calcPercentageChange(
      current.salesAmount,
      previous.salesAmount
    ),
    avgRating: calcPercentageChange(current.avgRating, previous.avgRating),
  };
}

async function getProductsMetrics(
  userId,
  filterType = null,
  sortBy = null,
  categoryId = null,
  skuId = null,
  page = 1,
  limit = 10
) {
  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  const currentWeekEnd = new Date();
  currentWeekEnd.setDate(currentWeekEnd.getDate() - 1);

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);

  const offset = (page - 1) * limit;

  const whereConditions = [
    `"cat"."user_id" = :userId`,
    `"p"."is_deleted" = false`,
    `"pv"."is_active" = true`,
    `"pv"."is_deleted" = false`,
  ];

  const replacements = {
    userId,
    currentWeekStart,
    currentWeekEnd,
    previousWeekStart,
    previousWeekEnd,
    limit,
    offset,
  };

  if (categoryId) {
    whereConditions.push(`"cat"."category_id" = :categoryId`);
    replacements.categoryId = categoryId;
  }

  if (skuId) {
    whereConditions.push(`"p"."skuId" ILIKE :skuPattern`);
    replacements.skuPattern = `%${skuId}%`;
  }

  const whereClause = whereConditions.join(" AND ");

  let orderClause = "";
  if (sortBy === "topSelling") orderClause = `ORDER BY "currentOrders" DESC`;
  else if (sortBy === "lowSelling")
    orderClause = `ORDER BY "currentOrders" ASC`;

  const mainQuery = `
    WITH product_metrics AS (
      SELECT 
        "p"."id",
        "p"."name",
        MIN("pv"."trabuwo_price") AS "price",
        SUM("pv"."inventory") AS "stock",
        "pv"."sku_id" AS "skuId",
        "cat"."category_id" AS "categoryId",
        "c"."name" AS "categoryName",
        COALESCE(SUM(CASE WHEN "pmd"."date" BETWEEN :currentWeekStart AND :currentWeekEnd THEN "pmd"."orders" ELSE 0 END), 0) AS "currentOrders",
        COALESCE(SUM(CASE WHEN "pmd"."date" BETWEEN :currentWeekStart AND :currentWeekEnd THEN "pmd"."views" ELSE 0 END), 0) AS "currentViews",
        COALESCE(SUM(CASE WHEN "pmd"."date" BETWEEN :currentWeekStart AND :currentWeekEnd THEN "pmd"."clicks" ELSE 0 END), 0) AS "currentClicks",
        COALESCE(SUM(CASE WHEN "pmd"."date" BETWEEN :currentWeekStart AND :currentWeekEnd THEN "pmd"."sales_amount" ELSE 0 END), 0) AS "currentSalesAmount",
        COALESCE(AVG(CASE WHEN "pmd"."date" BETWEEN :currentWeekStart AND :currentWeekEnd THEN "pmd"."avg_rating" ELSE 0 END), 0) AS "currentAvgRating",
        COALESCE(SUM(CASE WHEN "pmd"."date" BETWEEN :previousWeekStart AND :previousWeekEnd THEN "pmd"."orders" ELSE 0 END), 0) AS "previousOrders",
        COALESCE(SUM(CASE WHEN "pmd"."date" BETWEEN :previousWeekStart AND :previousWeekEnd THEN "pmd"."views" ELSE 0 END), 0) AS "previousViews",
        COALESCE(SUM(CASE WHEN "pmd"."date" BETWEEN :previousWeekStart AND :previousWeekEnd THEN "pmd"."clicks" ELSE 0 END), 0) AS "previousClicks",
        COALESCE(SUM(CASE WHEN "pmd"."date" BETWEEN :previousWeekStart AND :previousWeekEnd THEN "pmd"."sales_amount" ELSE 0 END), 0) AS "previousSalesAmount",
        COALESCE(AVG(CASE WHEN "pmd"."date" BETWEEN :previousWeekStart AND :previousWeekEnd THEN "pmd"."avg_rating" ELSE 0 END), 0) AS "previousAvgRating"
      FROM "products" AS "p"
      INNER JOIN "catalogues" AS "cat" ON "p"."catalogue_id" = "cat"."id"
      INNER JOIN "categories" AS "c" ON "cat"."category_id" = "c"."id"
      INNER JOIN "product_variants" AS "pv" ON "p"."id" = "pv"."product_id"
      LEFT JOIN "product_metrics_daily" AS "pmd" ON "p"."id" = "pmd"."product_id"
      WHERE ${whereClause}
      GROUP BY "p"."id", "p"."name", "pv"."sku_id", "cat"."category_id", "c"."name"
    )
    SELECT * FROM product_metrics
    ${orderClause}
    LIMIT :limit OFFSET :offset
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM "products" AS "p"
    INNER JOIN "catalogues" AS "cat" ON "p"."catalogue_id" = "cat"."id"
    INNER JOIN "product_variants" AS "pv" ON "p"."id" = "pv"."product_id"
    WHERE ${whereClause}
  `;

  const [results, countResult] = await Promise.all([
    sequelize.query(mainQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    }),
    sequelize.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    }),
  ]);

  if (results.length === 0) {
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  const productImages = await ProductImage.findAll({
    where: {
      productId: { [Op.in]: results.map((r) => r.id) },
      isPrimary: true,
      isActive: true,
      isDeleted: false,
    },
    attributes: ["productId", "imageUrl"],
    raw: true,
  });

  const imageMap = productImages.reduce((acc, img) => {
    acc[img.productId] = img.imageUrl;
    return acc;
  }, {});

  const formattedResults = results.map((row) => {
    const current = {
      views: parseInt(row.currentViews) || 0,
      clicks: parseInt(row.currentClicks) || 0,
      orders: parseInt(row.currentOrders) || 0,
      salesAmount: parseFloat(row.currentSalesAmount) || 0,
      avgRating: parseFloat(row.currentAvgRating) || 0,
    };

    const previous = {
      views: parseInt(row.previousViews) || 0,
      clicks: parseInt(row.previousClicks) || 0,
      orders: parseInt(row.previousOrders) || 0,
      salesAmount: parseFloat(row.previousSalesAmount) || 0,
      avgRating: parseFloat(row.previousAvgRating) || 0,
    };

    return {
      product: {
        id: row.id,
        name: row.name,
        price: parseFloat(row.price),
        stock: parseInt(row.stock),
        skuId: row.skuId,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        imageUrl: imageMap[row.id] || null,
      },
      currentWeekMetrics: current,
      previousWeekMetrics: previous,
      percentageChanges: calculatePercentageChanges(current, previous),
    };
  });

  const finalResults = filterType
    ? formattedResults.filter((r) => r.percentageChanges[filterType] < 0)
    : formattedResults;

  const total = filterType
    ? finalResults.length
    : parseInt(countResult[0].total);

  return {
    data: finalResults,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function getTotalMetrics(userId, startDate, endDate) {
  const currentPeriodStart = new Date(startDate);
  const currentPeriodEnd = new Date(endDate);

  const dateDifference =
    currentPeriodEnd.getTime() - currentPeriodStart.getTime();

  const previousPeriodStart = new Date(
    currentPeriodStart.getTime() - dateDifference
  );
  const previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);

  const currentPeriodTotals = await aggregateTotalMetrics(
    userId,
    currentPeriodStart,
    currentPeriodEnd
  );
  const previousPeriodTotals = await aggregateTotalMetrics(
    userId,
    previousPeriodStart,
    previousPeriodEnd
  );

  const percentageChanges = calculatePercentageChanges(
    currentPeriodTotals,
    previousPeriodTotals
  );

  return {
    currentPeriod: {
      data: currentPeriodTotals,
      startDate: currentPeriodStart.toISOString().split("T")[0],
      endDate: currentPeriodEnd.toISOString().split("T")[0],
    },
    previousPeriod: {
      data: previousPeriodTotals,
      startDate: previousPeriodStart.toISOString().split("T")[0],
      endDate: previousPeriodEnd.toISOString().split("T")[0],
    },
    percentageChanges,
    dateDifference: Math.ceil(dateDifference / (1000 * 60 * 60 * 24)),
  };
}

async function aggregateTotalMetrics(userId, startDate, endDate) {
  const result = await ProductMetricsDaily.findAll({
    attributes: [
      [fn("SUM", col("views")), "totalViews"],
      [fn("SUM", col("clicks")), "totalClicks"],
      [fn("SUM", col("orders")), "totalOrders"],
      [fn("SUM", col("sales_amount")), "totalSalesAmount"],
      [fn("AVG", col("avg_rating")), "avgRating"],
    ],
    include: [
      {
        model: Product,
        as: "product",
        include: [
          {
            model: Catalogue,
            as: "catalogue",
            include: [
              {
                model: User,
                as: "seller",
                where: { id: userId },
                attributes: [],
              },
            ],
            attributes: [],
          },
        ],
        attributes: [],
      },
    ],
    where: {
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
    raw: true,
  });

  return (
    result[0] || {
      totalViews: 0,
      totalClicks: 0,
      totalOrders: 0,
      totalSalesAmount: 0,
      avgRating: 0,
    }
  );
}

async function getWeeklyComparisonStats(userId) {
  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  const currentWeekEnd = new Date();
  currentWeekEnd.setDate(currentWeekEnd.getDate() - 1);

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);

  const products = await Product.findAll({
    include: [
      {
        model: Catalogue,
        as: "catalogue",
        where: { userId: userId },
        attributes: [],
      },
    ],
    attributes: ["id", "name"],
    raw: true,
  });

  if (products.length === 0) {
    return {
      totalProducts: 0,
      productsLosingViews: 0,
      productsLosingOrders: 0,
    };
  }

  const productIds = products.map((p) => p.id);

  const currentWeekData = await aggregateMetricsForProducts(
    productIds,
    currentWeekStart,
    currentWeekEnd
  );
  const previousWeekData = await aggregateMetricsForProducts(
    productIds,
    previousWeekStart,
    previousWeekEnd
  );

  let stats = {
    totalProducts: products.length,
    productsLosingViews: 0,
    productsLosingOrders: 0,
  };

  products.forEach((product) => {
    const current = currentWeekData[product.id] || {
      views: 0,
      orders: 0,
    };
    const previous = previousWeekData[product.id] || {
      views: 0,
      orders: 0,
    };

    if (current.views < previous.views) {
      stats.productsLosingViews++;
    }

    if (current.orders < previous.orders) {
      stats.productsLosingOrders++;
    }
  });

  return stats;
}


async function getDashboardCards(userId) {
  // Total Products
  const totalProducts = await Product.count({
    include: [
      {
        model: Catalogue,
        as: "catalogue",
        where: { userId },
        attributes: [],
      },
    ],
  });

  // Total Orders
  const totalOrdersResult = await ProductMetricsDaily.findOne({
    attributes: [[fn("SUM", col("orders")), "totalOrders"]],
    include: [
      {
        model: Product,
        as: "product",
        include: [
          {
            model: Catalogue,
            as: "catalogue",
            where: { userId },
            attributes: [],
          },
        ],
        attributes: [],
      },
    ],
    raw: true,
  });

  // Total Revenue
  const totalRevenueResult = await ProductMetricsDaily.findOne({
    attributes: [[fn("SUM", col("sales_amount")), "totalRevenue"]],
    include: [
      {
        model: Product,
        as: "product",
        include: [
          {
            model: Catalogue,
            as: "catalogue",
            where: { userId },
            attributes: [],
          },
        ],
        attributes: [],
      },
    ],
    raw: true,
  });

const totalCustomers = await User.count();

  return {
    totalProducts: totalProducts || 0,
    totalOrders: Number(totalOrdersResult?.totalOrders) || 0,
    totalRevenue: Number(totalRevenueResult?.totalRevenue) || 0,
    totalCustomers: totalCustomers || 0,
  };
}


async function getSellerList(page, limit) {
  const offset = (page - 1) * limit;

  const { count, rows } = await SellerOnboarding.findAndCountAll({
    include: [
      {
        model: User,
        as: "user",
        attributes: ["publicId", "email"],
      },
      {
        model: Store,
        as: "store",
        attributes: ["publicId", "name", "email"],
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    totalRecords: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    sellers: rows,
  };
}




async function getBuyerList(page, limit) {
  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
     attributes: {
      exclude: ["password"],  
    },
    include: [
      {
        model: Role,
        as: "Roles",
        where: { name: "buyer" }, 
        through: { attributes: [] },
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    totalRecords: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    buyers: rows,
  };
}


async function getOrderList(page, limit) {
  const offset = (page - 1) * limit;

  const { count, rows } = await Order.findAndCountAll({
    include: [
      {
        model: User,
        as: "buyer",
        attributes: ["id", "publicId", "email", "mobile"],
      },
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
          },
        ],
      },
      {
        model: UserAddress,
        as: "buyerAddress",
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    totalRecords: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    orders: rows,
  };
}





async function getDashboardSummary() {
  // Total Orders
  const totalOrders = await Order.count();

  // Pending Shipments
  const pendingShipments = await Order.count({
    where: {
      status: {
        [Op.in]: ["pending", "ready_to_ship"],
      },
    },
  });

  // Total Revenue (excluding cancelled)
  const totalRevenueData = await Order.findOne({
    attributes: [
    [fn("SUM", col("total_amount")), "totalRevenue"],
    ],
    where: {
      status: {
        [Op.ne]: "cancelled",
      },
    },
    raw: true,
  });

  return {
    totalOrders,
    pendingShipments,
    totalRevenue: totalRevenueData?.totalRevenue || 0,
  };
}


async function getDashboardRiskSummary() {

  const totalBuyers = await User.count({
    include: [
      {
        model: Role,
        as: "Roles",
        where: { name: "buyer" },
        through: { attributes: [] },
      },
    ],
  });

  // High cancellation users (>= 3 cancelled orders)
  const highRiskUsers = await Order.findAll({
    attributes: [
      "buyer_id",
      [fn("COUNT", col("id")), "cancelCount"],
    ],
    where: { status: "cancelled" },
    group: ["buyer_id"],
    having: sequelize.where(fn("COUNT", col("id")), {
      [Op.gte]: 3,
    }),
    raw: true,
  });

  const riskAlerts = await Order.count({
    where: {
      status: "cancelled",
    },
  });

  return {
    totalBuyers,
    highReturnFlags: highRiskUsers.length,
    riskAlerts,
  };
}



async function getPaymentOverview() {

  const totalPayments = await Payment.count();

  const totalAmount = await Payment.sum("amount", {
    where: { status: "captured" },
  });

  const totalRefunds = await Refund.count({
    where: { status: "processed" },
  });

  const failedPayments = await Payment.count({
    where: { status: "failed" },
  });

  const refundFailures = await Refund.count({
    where: { status: "failed" },
  });

  const gatewayDistribution = await Payment.findAll({
    attributes: [
      "gateway",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["gateway"],
    raw: true,
  });

  return {
    cards: {
      totalPayments,
      totalAmount: totalAmount || 0,
      totalRefunds,
      failedPayments,
    },
    gatewayDistribution,
    failedLogs: {
      refundFailures,
    },
  };
}

async function getDashboardGraph() {
  const graphData = await Payment.findAll({
    attributes: [
      [
        sequelize.fn("DATE", sequelize.col("Payment.created_at")),
        "date",
      ],
      [
        sequelize.fn("COUNT", sequelize.col("Payment.id")),
        "totalPayments",
      ],
      [
        sequelize.fn("SUM", sequelize.col("Payment.amount")),
        "totalRevenue",
      ],
    ],
    where: {
      status: "captured",
    },
    group: [sequelize.fn("DATE", sequelize.col("Payment.created_at"))],
    order: [
      [sequelize.fn("DATE", sequelize.col("Payment.created_at")), "ASC"],
    ],
    raw: true,
  });

  return { graph: graphData };
}
module.exports = {
  getProductsMetrics,
  getTotalMetrics,
  getWeeklyComparisonStats,
  getDashboardCards, 
  getSellerList,
  getBuyerList,
  getOrderList,
  getDashboardSummary,
  getDashboardRiskSummary,
  getPaymentOverview,
  getDashboardGraph
};
