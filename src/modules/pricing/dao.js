const { ProductPriceHistory, ProductView } = require("./model");
const { Product } = require("../product/model");
const sequelize = require("../../config/database");
const { NotFoundError } = require("../../utils/errors");
const { Op } = require("sequelize");

exports.updateProductPrices = async (productId, priceData, userId) => {
  const transaction = await sequelize.transaction();

  const currentProduct = await Product.findOne({
    where: { publicId: productId, isDeleted: false },
    transaction,
  });
  if (!currentProduct) {
    await transaction.rollback();
    throw new NotFoundError("Product not found");
  }

  const oldPrice = currentProduct.price;
  const oldDefectiveReturnPrice = currentProduct.defectiveReturnPrice;

  await Product.update(
    {
      price: priceData.price,
      defectiveReturnPrice: priceData.defectiveReturnPrice,
    },
    {
      where: { id: currentProduct.id },
      transaction,
    }
  );

  await ProductPriceHistory.create(
    {
      productId: currentProduct.id,
      userId,
      oldPrice,
      newPrice: priceData.price,
      oldDefectiveReturnPrice,
      newDefectiveReturnPrice: priceData.defectiveReturnPrice,
    },
    { transaction }
  );

  const updatedProduct = await Product.findOne({
    where: { publicId: productId, isDeleted: false },
    transaction,
  });

  await transaction.commit();

  return updatedProduct;
};

exports.getPricingStats = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const result = await sequelize.query(
    `
      SELECT 
        (SELECT COUNT(*) FROM product_price_history 
         WHERE "user_id" = :userId AND "created_at" >= :sevenDaysAgo) as price_updates_7d,
        
        (SELECT COUNT(*) FROM product_price_history 
         WHERE "user_id" = :userId AND "created_at" >= :thirtyDaysAgo) as price_updates_30d,
        
        (SELECT COUNT(*) FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         JOIN product_variants pv ON oi.product_variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         JOIN catalogues c ON p.catalogue_id = c.id
         WHERE c.user_id = :userId AND o.created_at >= :sevenDaysAgo) as orders_7d,
        
        (SELECT COUNT(*) FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         JOIN product_variants pv ON oi.product_variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         JOIN catalogues c ON p.catalogue_id = c.id
         WHERE c.user_id = :userId AND o.created_at >= :thirtyDaysAgo) as orders_30d,
         
        (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) 
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN product_variants pv ON oi.product_variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         JOIN catalogues c ON p.catalogue_id = c.id
         WHERE c.user_id = :userId 
         AND o.status = 'shipped' 
         AND o.created_at >= :sevenDaysAgo) as sales_7d,
         
        (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) 
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN product_variants pv ON oi.product_variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         JOIN catalogues c ON p.catalogue_id = c.id
         WHERE c.user_id = :userId 
         AND o.status = 'shipped' 
         AND o.created_at >= :thirtyDaysAgo) as sales_30d
    `,
    {
      replacements: { userId, sevenDaysAgo, thirtyDaysAgo },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  const stats = result[0] || {};

  return {
    last7Days: {
      priceUpdates: Number(stats.price_updates_7d || 0),
      orders: Number(stats.orders_7d || 0),
      sales: Number(stats.sales_7d || 0),
    },
    last30Days: {
      priceUpdates: Number(stats.price_updates_30d || 0),
      orders: Number(stats.orders_30d || 0),
      sales: Number(stats.sales_30d || 0),
    },
  };
};

exports.getProductsLosingViews = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const totalProducts = await Product.count({
    include: [
      {
        model: require("../catalogue/model"),
        as: "catalogue",
        where: { userId },
        attributes: [],
      },
    ],
    where: {
      isDeleted: false,
      isActive: true,
    },
  });

  const productsLosingViews = await ProductView.count({
    include: [
      {
        model: Product,
        as: "product",
        include: [
          {
            model: require("../catalogue/model"),
            as: "catalogue",
            where: { userId },
            attributes: [],
          },
        ],
        where: {
          isDeleted: false,
          isActive: true,
        },
        attributes: [],
      },
    ],
    where: {
      viewDate: {
        [Op.in]: [
          sequelize.literal("CURRENT_DATE - INTERVAL '7 days'"),
          sequelize.literal("CURRENT_DATE - INTERVAL '14 days'"),
        ],
      },
    },
    group: ["ProductView.productId"],
    having: sequelize.literal(`
      SUM(CASE WHEN viewDate = CURRENT_DATE - INTERVAL '7 days' THEN viewCount ELSE 0 END) <
      SUM(CASE WHEN viewDate = CURRENT_DATE - INTERVAL '14 days' THEN viewCount ELSE 0 END)
    `),
  });

  return {
    productsLosingViews: productsLosingViews.length || 0,
    totalProducts,
  };
};

exports.upsertProductViews = async (viewData) => {
  const transaction = await sequelize.transaction();

  try {
    for (const view of viewData) {
      await ProductView.upsert(
        {
          productId: view.productId,
          viewDate: view.viewDate,
          viewCount: view.viewCount,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
