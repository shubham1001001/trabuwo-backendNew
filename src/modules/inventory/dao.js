const { Op } = require("sequelize");
const sequelize = require("../../config/database");
const Catalogue = require("../catalogue/model");
const { Product, ProductImage, ProductVariant } = require("../product/model");
const Category = require("../category/model");
const { Order, OrderItem } = require("../order/model");
const { NotFoundError, ValidationError } = require("../../utils/errors");
const { buildCategoryTree } = require("../category/helper");


class InventoryDAO {
  async getCataloguesWithProducts(filters, pagination, userId) {
    const {
      status,
      sortBy,
      stockFilter,
      blockReasonFilter,
      catalogueId,
      categoryId,
    } = filters;
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    if (status === "blocked" && blockReasonFilter) {
      whereClause.blockReasonType = blockReasonFilter;
    }

    const catalogueWhereClause = { userId };
    if (catalogueId) {
      catalogueWhereClause.id = catalogueId;
    }
    if (categoryId) {
      catalogueWhereClause.categoryId = categoryId;
    }

    const orderClause =
      sortBy === "oldest" ? [["createdAt", "ASC"]] : [["createdAt", "DESC"]];

    let productWhereClause = { ...whereClause };
    if (status === "active" && stockFilter) {
      const andConditions = [];
      if (stockFilter === "out_of_stock") {
        andConditions.push(
          sequelize.literal(`(
            SELECT COALESCE(SUM(inventory), 0)
            FROM product_variants
            WHERE product_variants.product_id = "products"."id"
            AND product_variants.is_deleted = false
          ) = 0`)
        );
      } else if (stockFilter === "low_stock") {
        andConditions.push(
          sequelize.literal(`(
            SELECT COALESCE(SUM(inventory), 0)
            FROM product_variants
            WHERE product_variants.product_id = "products"."id"
            AND product_variants.is_deleted = false
          ) > 5 AND (
            SELECT COALESCE(SUM(inventory), 0)
            FROM product_variants
            WHERE product_variants.product_id = "products"."id"
            AND product_variants.is_deleted = false
          ) <= 10`)
        );
      }
      if (andConditions.length > 0) {
        productWhereClause[Op.and] = andConditions;
      }
    }

    const productInclude = {
      model: Product,
      as: "products",
      where: productWhereClause,
      attributes: [],
    };

    const catalogueIds = await Catalogue.findAll({
      where: catalogueWhereClause,
      include: [productInclude],
      group: ["Catalogue.id"],
      order: orderClause,
      limit,
      offset,
    });

    if (catalogueIds.length === 0) {
      return { catalogues: [], total: 0, page, limit };
    }

    const catalogueIdList = catalogueIds.map((cat) => cat.id);

    const catalogues = await Catalogue.findAll({
      where: {
        id: { [Op.in]: catalogueIdList },
        userId,
      },
      include: [
        {
          model: Category,
          as: "category",
        },
        {
          model: Product,
          as: "products",
          where: productWhereClause,
          include: [
            {
              model: ProductImage,
              as: "images",
            },
            {
              model: ProductVariant,
              as: "variants",
            },
          ],
        },
      ],
      order: orderClause,
    });

    const totalProductInclude = {
      model: Product,
      as: "products",
      where: productWhereClause,
      attributes: [],
    };

    const totalResult = await Catalogue.findAll({
      where: catalogueWhereClause,
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("Catalogue.id")), "total"],
      ],
      include: [totalProductInclude],
      group: ["Catalogue.id"],
    });

    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);

    // Calculate stats for each product
    for (const catalogue of catalogues) {
      for (const product of catalogue.products) {
        const variantIds = product.variants.map(v => v.id);
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const orderCount = await OrderItem.sum('quantity', {
          where: {
            productVariantId: { [Op.in]: variantIds },
            createdAt: { [Op.gte]: last30Days }
          }
        }) || 0;

        const estimatedOrderPerDay = Number((orderCount / 30).toFixed(2));
        const totalInventory = product.variants.reduce((sum, v) => sum + (v.inventory || 0), 0);
        const daysToStockout = estimatedOrderPerDay > 0 ? Math.ceil(totalInventory / estimatedOrderPerDay) : null;

        product.setDataValue('estimatedOrderPerDay', estimatedOrderPerDay);
        product.setDataValue('daysToStockout', daysToStockout);
      }
    }

    return { catalogues, total, page, limit, totalPages };

  }

  async getCatalogueByIdAndUserId(catalogueId, userId) {
    return await Catalogue.findOne({
      where: { id: catalogueId, userId },
      attributes: ["id", "name", "userId"],
    });
  }

  async getCategoryByIdAndUserId(categoryId, userId) {
    return await Category.findOne({
      where: { id: categoryId, isDeleted: false },
      include: [
        {
          model: Catalogue,
          as: "catalogues",
          where: { userId, isDeleted: false },
          attributes: [],
          required: true, // INNER JOIN - only categories with user's catalogues
        },
      ],
      attributes: ["id", "name"],
    });
  }

  // async updateProductStock(productId, newStock, userId) {
  //   return await sequelize.transaction(async (t) => {
  //     const product = await Product.findOne({
  //       where: { publicId: productId, isDeleted: false },
  //       include: [
  //         {
  //           model: Catalogue,
  //           where: { userId },
  //           as: "catalogue",
  //           attributes: ["id", "userId"],
  //         },
  //       ],
  //       transaction: t,
  //       lock: t.LOCK.UPDATE,
  //     });

  //     if (!product) {
  //       throw new NotFoundError("Product not found");
  //     }

  //     const variants = await ProductVariant.findAll({
  //       where: { productId: product.id, isDeleted: false },
  //       transaction: t,
  //       lock: t.LOCK.UPDATE,
  //     });

  //     if (variants.length === 0) {
  //       throw new NotFoundError("Product has no variants");
  //     }

  //     const totalInventory = variants.reduce(
  //       (sum, variant) => sum + (variant.inventory || 0),
  //       0
  //     );

  //     // Capture previous inventories before update for notification logic
  //     const variantsBeforeUpdate = variants.map((v) => ({
  //       id: v.id,
  //       inventory: v.inventory || 0,
  //     }));

  //     if (totalInventory === 0 && product.status === "paused") {
  //       await ProductVariant.update(
  //         { inventory: newStock },
  //         {
  //           where: { productId: product.id, isDeleted: false },
  //           transaction: t,
  //         }
  //       );
  //       await product.update({ status: "active" }, { transaction: t });
  //     } else {
  //       await ProductVariant.update(
  //         { inventory: newStock },
  //         {
  //           where: { productId: product.id, isDeleted: false },
  //           transaction: t,
  //         }
  //       );
  //     }

  //     // Any variant that was 0 and now newStock > 0 should enqueue a single dispatcher job
  //     if (newStock > 0) {
  //       for (const variantBefore of variantsBeforeUpdate) {
  //         if (variantBefore.inventory === 0) {
  //           // Use Graphile Worker's add_job SQL function inside the same transaction.
  //           await t.sequelize.query(
  //             `
  //               SELECT graphile_worker.add_job(
  //                 $1::text,         -- task_identifier
  //                 $2::json,         -- payload
  //                 job_key := $3     -- ensures de-duplication per variant
  //               );
  //             `,
  //             {
  //               transaction: t,
  //               bind: [
  //                 "dispatch-stock-notifications",
  //                 JSON.stringify({
  //                   productVariantId: variantBefore.id,
  //                   newStock,
  //                 }),
  //                 `dispatch-stock-notifications-${variantBefore.id}`,
  //               ],
  //             }
  //           );
  //         }
  //       }
  //     }

  //     return product;
  //   });
  // }

async updateProductStock(productId, newStock, userId) {
  return await sequelize.transaction(async (t) => {

    // 1️⃣ Find product with ownership check (productId is the numeric DB id)
    const product = await Product.findOne({
      where: { id: productId, isDeleted: false },
      include: [
        {
          model: Catalogue,
          where: { userId },
          as: "catalogue",
          attributes: ["id", "userId"],
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // 2️⃣ Get all variants
    const variants = await ProductVariant.findAll({
      where: { productId: product.id, isDeleted: false },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (variants.length === 0) {
      throw new NotFoundError("Product has no variants");
    }

    // 3️⃣ Total inventory BEFORE update
    const totalInventoryBefore = variants.reduce(
      (sum, variant) => sum + (variant.inventory || 0),
      0
    );

    // 4️⃣ Capture previous inventories (for notification)
    const variantsBeforeUpdate = variants.map((v) => ({
      id: v.id,
      inventory: v.inventory || 0,
    }));

    // 5️⃣ Update stock (⚠️ all variants same stock)
    await ProductVariant.update(
      { inventory: newStock },
      {
        where: { productId: product.id, isDeleted: false },
        transaction: t,
      }
    );

    // 6️⃣ Activate product if needed
    if (totalInventoryBefore === 0 && product.status === "paused") {
      await product.update({ status: "active" }, { transaction: t });
    }

    // 7️⃣ Notification job (0 → >0) - only if Graphile Worker is running
    if (newStock > 0) {
      for (const variantBefore of variantsBeforeUpdate) {
        if (variantBefore.inventory === 0) {
          try {
            await t.sequelize.query(
              `
                SELECT graphile_worker.add_job(
                  $1::text,
                  $2::json,
                  job_key := $3
                );
              `,
              {
                transaction: t,
                bind: [
                  "dispatch-stock-notifications",
                  JSON.stringify({
                    productVariantId: variantBefore.id,
                    newStock,
                  }),
                  `dispatch-stock-notifications-${variantBefore.id}`,
                ],
              }
            );
          } catch (workerErr) {
            // Graphile Worker may not be running in dev — non-fatal
            console.warn(`[inventory] Graphile Worker not available, skipping notification for variant ${variantBefore.id}:`, workerErr.message);
          }
        }
      }
    }

    // 8️⃣ Calculate UPDATED total inventory directly — we just set all variants to newStock
    // (avoids a redundant SELECT FOR UPDATE that causes Postgres lock errors)
    const updatedTotalInventory = newStock * variants.length;

    // 9️⃣ Convert Sequelize instance → plain object
    const productData = product.toJSON();

    // 🔟 Override dynamicFields.inventory safely
    productData.dynamicFields = {
      ...(productData.dynamicFields || {}),
      inventory: updatedTotalInventory,
    };

    // Return updated structure
    return productData;
  });
}

async updateVariantStock(variantId, newStock, userId) {
  return await sequelize.transaction(async (t) => {
    const variant = await ProductVariant.findOne({
      where: { id: variantId, isDeleted: false },
      include: [
        {
          model: Product,
          as: "product",
          required: true,
          include: [
            {
              model: Catalogue,
              as: "catalogue",
              where: { userId },
              attributes: ["id", "userId"],
              required: true
            }
          ]
        }
      ],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!variant) {
      throw new NotFoundError("Variant not found or permission denied");
    }

    const oldInventory = variant.inventory || 0;
    await variant.update({ inventory: newStock }, { transaction: t });

    // Notification job (0 → >0)
    if (oldInventory === 0 && newStock > 0) {
      try {
        await t.sequelize.query(
          `
            SELECT graphile_worker.add_job(
              $1::text,
              $2::json,
              job_key := $3
            );
          `,
          {
            transaction: t,
            bind: [
              "dispatch-stock-notifications",
              JSON.stringify({
                productVariantId: variant.id,
                newStock,
              }),
              `dispatch-stock-notifications-${variant.id}`,
            ],
          }
        );
      } catch (workerErr) {
        console.warn(`[inventory] Graphile Worker error:`, workerErr.message);
      }
    }

    return variant;
  });
}



  async bulkPauseProducts(catalogueId, productIds, userId, options = {}) {
    const catalogue = await Catalogue.findOne({
      where: { id: catalogueId, userId },
    });

    if (!catalogue) {
      throw new NotFoundError(
        "Catalogue not found or you don't have permission to access it"
      );
    }

    const existingProducts = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        catalogueId: catalogueId,
      },
      attributes: ["id"],
    });

    if (existingProducts.length !== productIds.length) {
      throw new ValidationError(
        "Some products do not belong to the specified catalogue"
      );
    }

    const [updatedCount] = await Product.update(
      {
        status: "paused",
      },
      {
        where: {
          id: { [Op.in]: productIds },
          catalogueId: catalogueId,
          status: "active",
        },
        ...options,
      }
    );

    await ProductVariant.update(
      { inventory: 0 },
      {
        where: {
          productId: { [Op.in]: productIds },
          isDeleted: false,
        },
        ...options,
      }
    );

    return { updatedCount };
  }

  async getUserCategoryTree(userId) {
    const categories = await Category.findAll({
      attributes: [
        "id",
        "name",
        "parentId",
        "isVisible",
        "createdAt",
        "updatedAt",
      ],
      where: {
        isDeleted: false,
        isVisible: true,
      },
      include: [
        {
          model: Catalogue,
          as: "catalogues",
          where: {
            userId,
            isDeleted: false,
          },
          attributes: [],
          required: true,
        },
      ],
      order: [["name", "ASC"]],
    });

    return buildCategoryTree(categories, null);
  }



  async getInventoryList(userId) {
  const products = await Product.findAll({
    where: {
      isDeleted: false,
    },
    attributes: [
      "id",
      "publicId",
      "name",
      "description",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: Catalogue,
        as: "catalogue",
        where: {
          userId,
          isDeleted: false,
        },
        attributes: ["id", "name", "userId"],
        required: true, // only user data
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "parentId"],
          },
        ],
      },
      {
        model: ProductVariant,
        as: "variants",
        attributes: [
          "id",
          "publicId",
          "trabuwoPrice",
          "mrp",
          "inventory",
          "skuId"
        ],
      },
      {
        model: ProductImage,
        as: "images",
        attributes: ["imageUrl", "isPrimary", "sortOrder"],
        where: { isDeleted: false },
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return products;
}
}

module.exports = new InventoryDAO();
