const Catalogue = require("./model");
const sequelize = require("../../config/database");
const { Op, QueryTypes } = require("sequelize");
const Category = require("../category/model");
const { Product, ProductImage, ProductVariant } = require("../product/model");
const { PromotionProduct } = require("../promotions/model");
const { InfluencerPromotion } = require("../influencerMarketing/model");
const WishlistItem = require("../wishlist/model");
const CursorHelper = require("../../utils/cursorHelper");
const sellerOnboardingDao = require("../sellerOnboarding/dao");
const storeFollowDao = require("../storeFollow/dao");
const { User } = require("../auth/model");

exports.createCatalogue = async (data, options = {}) => {
  return await Catalogue.create(data, {
    ...options,
    include: [
      {
        model: Product,
        as: "products",
        include: [
          { model: ProductImage, as: "images" },
          { model: ProductVariant, as: "variants" },
        ],
      },
    ],
  });
};

exports.getCatalogueById = async (id) => {
  return await Catalogue.findOne({
    where: { id, isDeleted: false },
  });
};

exports.getCatalogueByPublicId = async (publicId) => {
  return await Catalogue.findOne({
    where: { publicId, isDeleted: false },
  });
};

exports.getAllCatalogues = async (filters = {}) => {
  const whereClause = { isDeleted: false, ...filters };
  return await Catalogue.findAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
  });
};

exports.getCatalogueIdsByUserId = async (userId, options = {}) => {
  const whereClause = { userId, isDeleted: false };
  const catalogues = await Catalogue.findAll({
    where: whereClause,
    attributes: ["id"],
    ...options,
  });
  return catalogues.map((catalogue) => catalogue.id);
};

exports.getCataloguesByUserId = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    search = null,
    wishlistUserId = null,
  } = options;
  const offset = (page - 1) * limit;

  const whereClause = { userId, isDeleted: false };
  if (status) {
    whereClause.status = status;
  }

  const totalCount = await Catalogue.count({
    where: whereClause,
  });

  const productWhereClause = { isDeleted: false };
  if (search && search.trim()) {
    productWhereClause.searchVector = sequelize.literal(
      `"products"."search_vector" @@ plainto_tsquery('english', ${sequelize.escape(
        search.trim(),
      )})`,
    );
  }

  const maxTrabuwoPriceExpr =
    '(SELECT MAX("variants"."trabuwo_price") FROM "products" AS "products" ' +
    'INNER JOIN "product_variants" AS "variants" ON "products"."id" = "variants"."product_id" ' +
    'WHERE "products"."catalogue_id" = "Catalogue"."id" ' +
    'AND "products"."is_deleted" = false AND "variants"."is_deleted" = false)';

  const rows = await Catalogue.findAll({
    where: whereClause,
    attributes: [
      "publicId",
      "name",
      "description",
      "status",
      "userId",
      "categoryId",
      "averageRating",
      "reviewsCount",
      "thumbnailUrl",
      "minPrice",
      "maxPrice",
      [sequelize.literal(maxTrabuwoPriceExpr), "maxTrabuwoPrice"],
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["name", "slug"],
      },
      {
        model: InfluencerPromotion,
        as: "influencerPromotions",
        attributes: ["commission", "status"],
      },
      {
        model: Product,
        as: "products",
        where: productWhereClause,
        attributes: ["publicId", "name"],
        required: search && search.trim() ? true : false,
        include: [
          {
            model: ProductVariant,
            as: "variants",
            where: { isDeleted: false },
            attributes: ["trabuwoPrice", "mrp"],
            required: false,
          },
          {
            model: PromotionProduct,
            as: "promotions",
            attributes: ["discountPercent", "returnDefectiveDiscountPercent"],
            required: false,
            where: { isActive: true },
          },
          {
            model: ProductImage,
            as: "images",
            where: { isDeleted: false },
            attributes: ["imageUrl", "sortOrder", "isPrimary"],
            required: false,
            order: [["sortOrder", "ASC"]],
          },
          ...(wishlistUserId
            ? [
                {
                  model: WishlistItem,
                  as: "wishlistItems",
                  where: { userId: wishlistUserId },
                  required: false,
                  attributes: ["publicId"],
                },
              ]
            : []),
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  const processedResults = rows.map((catalogue) => {
    const catalogueData = catalogue.toJSON();
    if (wishlistUserId) {
      catalogueData.isWishlisted =
        catalogue.products?.some(
          (product) =>
            product.wishlistItems && product.wishlistItems.length > 0,
        ) || false;
    } else {
      catalogueData.isWishlisted = false;
    }
    return catalogueData;
  });

  return {
    catalogues: processedResults,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

exports.updateCatalogueById = async (id, data) => {
  const [updatedRows] = await Catalogue.update(data, {
    where: { id, isDeleted: false },
  });

  if (updatedRows === 0) {
    return null;
  }

  return await this.getCatalogueById(id);
};

exports.softDeleteCatalogueById = async (id) => {
  const [updatedRows] = await Catalogue.update(
    { isDeleted: true },
    { where: { id, isDeleted: false } },
  );

  return updatedRows > 0;
};

exports.getCataloguesByStatus = async (status, options = {}) => {
  const { page = 1, limit = 10, startDate, endDate, categoryId } = options;
  const offset = (page - 1) * limit;

  const whereClause = { status, isDeleted: false };

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      whereClause.createdAt[Op.lte] = new Date(endDate);
    }
  }

  const totalCount = await Catalogue.count({
    where: whereClause,
  });

  const rows = await Catalogue.findAll({
    where: whereClause,
    attributes: [
      "id",
      "publicId",
      "name",
      "description",
      "status",
      "userId",
      "categoryId",
      "averageRating",
      "reviewsCount",
      "thumbnailUrl",
      "minPrice",
      "maxPrice",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
      {
        model: User,
        as: "seller",
        attributes: ["id", "publicId"],
        include: [
          {
            model: require("../sellerOnboarding/model").SellerOnboarding,
            as: "sellerOnboarding",
            attributes: ["id"],
            include: [
              {
                model: require("../sellerOnboarding/model").Store,
                as: "store",
                attributes: ["name", "ownerFullName"],
              },
            ],
          },
        ],
      },
      {
        model: Product,
        as: "products",
        attributes: ["id", "publicId", "name"],
        include: [
          {
            model: ProductImage,
            as: "images",
            attributes: ["imageUrl", "isPrimary", "sortOrder"],
            required: false,
          },
          {
            model: ProductVariant,
            as: "variants",
            attributes: ["id", "trabuwoPrice", "mrp", "inventory"],
            required: false,
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  return {
    catalogues: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

exports.getLastCatalogueByUserId = async (userId) => {
  return await Catalogue.findOne({
    where: { userId, isDeleted: false },
    order: [["createdAt", "DESC"]],
  });
};

exports.countByUserId = async (userId) => {
  return await Catalogue.count({ where: { userId, isDeleted: false } });
};

exports.countByUserIdAndStatus = async (userId, status) => {
  return await Catalogue.count({
    where: { userId, status, isDeleted: false },
  });
};

exports.getSellerStatsByUserId = async (userId) => {
  const cataloguesCount = await exports.countByUserId(userId);

  const sellerOnboarding =
    await sellerOnboardingDao.getSellerOnboardingByUserId(userId);
  let followersCount = 0;
  if (sellerOnboarding) {
    const store = await sellerOnboardingDao.getStoresByOnboardingId(
      sellerOnboarding.id,
    );
    if (store) {
      followersCount = await storeFollowDao.getStoreFollowersCount(store.id);
    }
  }

  const sql = `
    SELECT 
      COALESCE(AVG(r.rating), 0) AS "averageRating",
      COUNT(*)::BIGINT AS "ratingCount"
    FROM catalogues c
    JOIN products p ON p.catalogue_id = c.id AND p.is_deleted = false
    JOIN product_variants pv ON pv.product_id = p.id AND pv.is_deleted = false
    JOIN order_items oi ON oi.product_variant_id = pv.id
    JOIN orders o ON o.id = oi.order_id AND o.status = 'shipped'
    JOIN reviews r ON r.order_item_id = oi.id AND r.is_deleted = false
    WHERE c.user_id = :userId
    AND c.is_deleted = false
  `;

  const ratingResult = await sequelize.query(sql, {
    replacements: { userId },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const result = ratingResult[0] || { averageRating: 0, ratingCount: 0 };

  return {
    averageRating: parseFloat(result.averageRating) || 0,
    ratingCount: parseInt(result.ratingCount) || 0,
    cataloguesCount: cataloguesCount || 0,
    followersCount: followersCount || 0,
  };
};

exports.getQcErrorCountStats = async () => {
  const result = await Catalogue.findOne({
    attributes: [
      [sequelize.literal("COUNT(*)"), "count"],
      [sequelize.literal("ARRAY_AGG(id)"), "catalogueIds"],
    ],
    where: {
      status: "qc_error",
      isDeleted: false,
    },
    raw: true,
  });

  return {
    count: parseInt(result?.count) || 0,
    catalogueIds: result?.catalogueIds || [],
  };
};

exports.getCatalogueStatusCountsStats = async () => {
  const result = await Catalogue.findOne({
    attributes: [
      [sequelize.literal("COUNT(*)"), "total"],
      [
        sequelize.literal("COUNT(CASE WHEN status = 'draft' THEN 1 END)"),
        "draft",
      ],
      [
        sequelize.literal(
          "COUNT(CASE WHEN status = 'qc_in_progress' THEN 1 END)",
        ),
        "qc_in_progress",
      ],
      [
        sequelize.literal("COUNT(CASE WHEN status = 'qc_passed' THEN 1 END)"),
        "qc_passed",
      ],
      [
        sequelize.literal("COUNT(CASE WHEN status = 'qc_error' THEN 1 END)"),
        "qc_error",
      ],
      [
        sequelize.literal("COUNT(CASE WHEN status = 'live' THEN 1 END)"),
        "live",
      ],
      [
        sequelize.literal("COUNT(CASE WHEN status = 'paused' THEN 1 END)"),
        "paused",
      ],
    ],
    where: {
      isDeleted: false,
    },
    raw: true,
  });

  return {
    total: parseInt(result?.total) || 0,
    byStatus: {
      draft: parseInt(result?.draft) || 0,
      qc_in_progress: parseInt(result?.qc_in_progress) || 0,
      qc_passed: parseInt(result?.qc_passed) || 0,
      qc_error: parseInt(result?.qc_error) || 0,
      live: parseInt(result?.live) || 0,
      paused: parseInt(result?.paused) || 0,
    },
  };
};

const { Buffer } = require("buffer");

const maxTrabuwoPriceExpr =
  '(SELECT MAX("variants"."trabuwo_price") FROM "products" AS "products" ' +
  'INNER JOIN "product_variants" AS "variants" ON "products"."id" = "variants"."product_id" ' +
  'WHERE "products"."catalogue_id" = "Catalogue"."id" ' +
  'AND "products"."is_deleted" = false AND "variants"."is_deleted" = false)';

const averageRatingFromReviewsExpr =
  '(SELECT COALESCE(ROUND(AVG("reviews"."rating")::numeric, 1), 0) FROM "products" AS "products" ' +
  'INNER JOIN "product_variants" AS "variants" ON "products"."id" = "variants"."product_id" ' +
  'INNER JOIN "order_items" AS "order_items" ON "variants"."id" = "order_items"."product_variant_id" ' +
  'INNER JOIN "orders" AS "orders" ON "order_items"."order_id" = "orders"."id" AND "orders"."status" = \'shipped\' ' +
  'INNER JOIN "reviews" AS "reviews" ON "order_items"."id" = "reviews"."order_item_id" AND "reviews"."is_deleted" = false ' +
  'WHERE "products"."catalogue_id" = "Catalogue"."id" ' +
  'AND "products"."is_deleted" = false AND "variants"."is_deleted" = false)';

const reviewsCountFromReviewsExpr =
  '(SELECT COUNT(*)::BIGINT FROM "products" AS "products" ' +
  'INNER JOIN "product_variants" AS "variants" ON "products"."id" = "variants"."product_id" ' +
  'INNER JOIN "order_items" AS "order_items" ON "variants"."id" = "order_items"."product_variant_id" ' +
  'INNER JOIN "orders" AS "orders" ON "order_items"."order_id" = "orders"."id" AND "orders"."status" = \'shipped\' ' +
  'INNER JOIN "reviews" AS "reviews" ON "order_items"."id" = "reviews"."order_item_id" AND "reviews"."is_deleted" = false ' +
  'WHERE "products"."catalogue_id" = "Catalogue"."id" ' +
  'AND "products"."is_deleted" = false AND "variants"."is_deleted" = false)';

const maxDiscountPercentExpr =
  '(SELECT COALESCE(MAX("promotion_products"."discount_percent"), 0) FROM "products" AS "products" ' +
  'INNER JOIN "promotion_products" AS "promotion_products" ON "products"."id" = "promotion_products"."product_id" ' +
  'WHERE "products"."catalogue_id" = "Catalogue"."id" ' +
  'AND "products"."is_deleted" = false ' +
  'AND "promotion_products"."is_active" = true)';

const encodeSortCursor = (payload) => {
  try {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  } catch {
    return null;
  }
};

const decodeSortCursor = (cursorString) => {
  try {
    if (!cursorString) return null;
    const json = Buffer.from(cursorString, "base64").toString();
    return JSON.parse(json);
  } catch {
    return null;
  }
};

exports.getAllCataloguesWithKeysetPagination = async (options) => {
  const {
    cursor,
    sortBy,
    limit = 20,
    search,
    filters = {},
    userId = null,
  } = options;

  const whereClause = { isDeleted: false, status: "live" };

  if (!sortBy && cursor) {
    const decodedCursor = CursorHelper.decodeCursor(cursor);
    if (decodedCursor) {
      whereClause.publicId = { [Op.lt]: decodedCursor };
    }
  }

  if (filters.rating != null) {
    const minRating = parseFloat(filters.rating);
    if (!isNaN(minRating)) {
      whereClause[Op.and] = whereClause[Op.and]
        ? [
            ...whereClause[Op.and],
            sequelize.literal(
              `(${averageRatingFromReviewsExpr}) >= ${sequelize.escape(
                minRating,
              )}`,
            ),
          ]
        : [
            sequelize.literal(
              `(${averageRatingFromReviewsExpr}) >= ${sequelize.escape(
                minRating,
              )}`,
            ),
          ];
    }
  }

  if (filters.discount != null) {
    const minDiscount = parseFloat(filters.discount);
    if (!isNaN(minDiscount)) {
      whereClause[Op.and] = whereClause[Op.and]
        ? [
            ...whereClause[Op.and],
            sequelize.literal(
              `(${maxDiscountPercentExpr}) >= ${sequelize.escape(minDiscount)}`,
            ),
          ]
        : [
            sequelize.literal(
              `(${maxDiscountPercentExpr}) >= ${sequelize.escape(minDiscount)}`,
            ),
          ];
    }
  }

  const productWhereClause = { isDeleted: false };
  if (search && search.trim()) {
    productWhereClause[Op.and] = [
      { isDeleted: false },
      {
        [Op.or]: [
          sequelize.literal(
            `"products"."search_vector" @@ plainto_tsquery('english', ${sequelize.escape(
              search.trim(),
            )})`,
          ),
          sequelize.literal(
            `similarity("products"."name", ${sequelize.escape(
              search.trim(),
            )}) > 0.3`,
          ),
        ],
      },
    ];
  }

  const productExcludedKeys = [
    "priceMin",
    "priceMax",
    "cursor",
    "limit",
    "search",
    "categoryIds",
    "size",
    "rating",
    "discount",
  ];
  const variantExcludedKeys = [
    "priceMin",
    "priceMax",
    "cursor",
    "limit",
    "search",
    "categoryIds",
  ];
  const productDynamicAndConditions = [];

  Object.entries(filters)
    .filter(([key]) => !productExcludedKeys.includes(key))
    .forEach(([key, value]) => {
      if (value) {
        const values = Array.isArray(value)
          ? value.filter(Boolean)
          : [value].filter(Boolean);

        if (values.length === 1) {
          productDynamicAndConditions.push({
            dynamicFields: { [Op.contains]: { [key]: values[0] } },
          });
        } else if (values.length > 1) {
          productDynamicAndConditions.push({
            [Op.or]: values.map((val) => ({
              dynamicFields: { [Op.contains]: { [key]: val } },
            })),
          });
        }
      }
    });

  if (productDynamicAndConditions.length > 0) {
    productWhereClause[Op.and] = productDynamicAndConditions;
  }

  const variantWhereClause = { isDeleted: false };
  const variantFilterKeys = ["size"];

  if (filters.priceMin || filters.priceMax) {
    const priceConditions = {};
    if (filters.priceMin)
      priceConditions[Op.gte] = parseFloat(filters.priceMin);
    if (filters.priceMax)
      priceConditions[Op.lte] = parseFloat(filters.priceMax);
    variantWhereClause.trabuwoPrice = priceConditions;
  }

  const variantDynamicAndConditions = [];
  Object.entries(filters)
    .filter(
      ([key]) =>
        !variantExcludedKeys.includes(key) && variantFilterKeys.includes(key),
    )
    .forEach(([key, value]) => {
      if (value) {
        const values = Array.isArray(value)
          ? value.filter(Boolean)
          : [value].filter(Boolean);

        if (values.length === 1) {
          variantDynamicAndConditions.push({
            dynamicFields: { [Op.contains]: { [key]: values[0] } },
          });
        } else if (values.length > 1) {
          variantDynamicAndConditions.push({
            [Op.or]: values.map((val) => ({
              dynamicFields: { [Op.contains]: { [key]: val } },
            })),
          });
        }
      }
    });

  if (variantDynamicAndConditions.length > 0) {
    variantWhereClause[Op.and] = variantDynamicAndConditions;
  }

  const hasVariantFilters =
    Object.keys(variantWhereClause).length > 1 ||
    filters.priceMin ||
    filters.priceMax;

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    whereClause.categoryId = { [Op.in]: filters.categoryIds };
  }

  const attributes = [
    "publicId",
    "name",
    "userId",
    "categoryId",
    [
      sequelize.literal(averageRatingFromReviewsExpr),
      "averageRatingFromReviews",
    ],
    [sequelize.literal(reviewsCountFromReviewsExpr), "reviewsCountFromReviews"],
    [sequelize.literal(maxDiscountPercentExpr), "maxDiscountPercent"],
    "thumbnailUrl",
    "minPrice",
    "maxPrice",
    [sequelize.literal(maxTrabuwoPriceExpr), "maxTrabuwoPrice"],
    "createdAt",
    "updatedAt",
  ];

  const queryOptions = {
    attributes,
    where: whereClause,
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["name", "slug"],
      },
      {
        model: InfluencerPromotion,
        as: "influencerPromotions",
        attributes: ["commission", "status"],
      },
      {
        model: Product,
        as: "products",
        where: productWhereClause,
        attributes: ["publicId", "name"],
        required: (search && search.trim()) || hasVariantFilters ? true : false,
        include: [
          {
            model: ProductVariant,
            as: "variants",
            where: variantWhereClause,
            attributes: ["trabuwoPrice", "mrp"],
            required: hasVariantFilters,
          },
          {
            model: PromotionProduct,
            as: "promotions",
            attributes: ["discountPercent", "returnDefectiveDiscountPercent"],
            required: false,
            where: { isActive: true },
          },
          {
            model: ProductImage,
            as: "images",
            where: { isDeleted: false },
            attributes: ["imageUrl", "sortOrder", "isPrimary"],
            required: false,
            order: [["sortOrder", "ASC"]],
          },
          ...(userId
            ? [
                {
                  model: WishlistItem,
                  as: "wishlistItems",
                  where: { userId },
                  required: false,
                  attributes: ["id"],
                },
              ]
            : []),
        ],
      },
    ],
    order: [["publicId", "DESC"]],
    limit: parseInt(limit) + 1,
  };

  if (sortBy === "priceHighToLow" || sortBy === "priceLowToHigh") {
    const direction = sortBy === "priceHighToLow" ? "DESC" : "ASC";

    queryOptions.order = [
      [sequelize.literal(maxTrabuwoPriceExpr), direction],
      ["publicId", direction],
    ];

    if (cursor) {
      const decoded = decodeSortCursor(cursor);
      if (decoded && decoded.sortBy === sortBy) {
        const { sortValue, publicId: lastPublicId } = decoded;
        if (sortValue != null && lastPublicId) {
          const priceOpSymbol = direction === "DESC" ? "<" : ">";
          const idOpSymbol = direction === "DESC" ? "<" : ">";
          const sortValueSql = sequelize.escape(sortValue);
          const lastPublicIdSql = sequelize.escape(lastPublicId);

          const cursorCondition = sequelize.literal(
            `(${maxTrabuwoPriceExpr} ${priceOpSymbol} ${sortValueSql} OR ` +
              `(${maxTrabuwoPriceExpr} = ${sortValueSql} AND "Catalogue"."public_id" ${idOpSymbol} ${lastPublicIdSql}))`,
          );

          whereClause[Op.and] = whereClause[Op.and]
            ? [...whereClause[Op.and], cursorCondition]
            : [cursorCondition];
        }
      }
    }
  } else if (sortBy === "rating") {
    queryOptions.order = [
      [sequelize.literal(averageRatingFromReviewsExpr), "DESC"],
      ["publicId", "DESC"],
    ];

    if (cursor) {
      const decoded = decodeSortCursor(cursor);
      if (decoded && decoded.sortBy === sortBy) {
        const { sortValue, publicId: lastPublicId } = decoded;
        if (sortValue != null && lastPublicId) {
          const ratingOpSymbol = "<";
          const idOpSymbol = "<";
          const sortValueSql = sequelize.escape(sortValue);
          const lastPublicIdSql = sequelize.escape(lastPublicId);

          const cursorCondition = sequelize.literal(
            `(${averageRatingFromReviewsExpr} ${ratingOpSymbol} ${sortValueSql} OR ` +
              `(${averageRatingFromReviewsExpr} = ${sortValueSql} AND "Catalogue"."public_id" ${idOpSymbol} ${lastPublicIdSql}))`,
          );

          whereClause[Op.and] = whereClause[Op.and]
            ? [...whereClause[Op.and], cursorCondition]
            : [cursorCondition];
        }
      }
    }
  } else if (sortBy === "promotion") {
    queryOptions.order = [
      [sequelize.literal(maxDiscountPercentExpr), "DESC"],
      ["publicId", "DESC"],
    ];

    if (cursor) {
      const decoded = decodeSortCursor(cursor);
      if (decoded && decoded.sortBy === sortBy) {
        const { sortValue, publicId: lastPublicId } = decoded;
        if (sortValue != null && lastPublicId) {
          const discountOpSymbol = "<";
          const idOpSymbol = "<";
          const sortValueSql = sequelize.escape(sortValue);
          const lastPublicIdSql = sequelize.escape(lastPublicId);

          const cursorCondition = sequelize.literal(
            `(${maxDiscountPercentExpr} ${discountOpSymbol} ${sortValueSql} OR ` +
              `(${maxDiscountPercentExpr} = ${sortValueSql} AND "Catalogue"."public_id" ${idOpSymbol} ${lastPublicIdSql}))`,
          );

          whereClause[Op.and] = whereClause[Op.and]
            ? [...whereClause[Op.and], cursorCondition]
            : [cursorCondition];
        }
      }
    }
  }

  const catalogues = await Catalogue.findAll(queryOptions);

  const hasNext = catalogues.length > limit;
  const results = hasNext ? catalogues.slice(0, limit) : catalogues;

  const processedResults = results.map((catalogue) => {
    const catalogueData = catalogue.toJSON();
    if (userId) {
      catalogueData.isWishlisted =
        catalogue.products?.some(
          (product) =>
            product.wishlistItems && product.wishlistItems.length > 0,
        ) || false;
    } else {
      catalogueData.isWishlisted = false;
    }
    return catalogueData;
  });

  let nextCursor = null;
  if (hasNext && processedResults.length > 0) {
    const lastCatalogue = processedResults[processedResults.length - 1];

    if (!sortBy) {
      nextCursor = CursorHelper.encodeCursor(lastCatalogue.publicId);
    } else if (sortBy === "priceHighToLow" || sortBy === "priceLowToHigh") {
      nextCursor = encodeSortCursor({
        sortBy,
        sortValue: lastCatalogue.maxTrabuwoPrice,
        publicId: lastCatalogue.publicId,
      });
    } else if (sortBy === "rating") {
      nextCursor = encodeSortCursor({
        sortBy,
        sortValue: lastCatalogue.averageRatingFromReviews,
        publicId: lastCatalogue.publicId,
      });
    } else if (sortBy === "promotion") {
      nextCursor = encodeSortCursor({
        sortBy,
        sortValue: lastCatalogue.maxDiscountPercent,
        publicId: lastCatalogue.publicId,
      });
    }
  }

  return {
    catalogues: processedResults,
    pagination: {
      hasNext,
      nextCursor,
      limit: parseInt(limit),
    },
  };
};

const pickRepresentativeImageUrl = (catalogueInstance) => {
  const catalogue = catalogueInstance.toJSON();
  if (!catalogue.products || catalogue.products.length === 0) {
    return null;
  }

  for (const product of catalogue.products) {
    if (product.images && product.images.length > 0) {
      const primaryImage =
        product.images.find((img) => img.isPrimary) || product.images[0];
      if (primaryImage && primaryImage.imageUrl) {
        return primaryImage.imageUrl;
      }
    }
  }

  return null;
};

exports.searchMinimalCatalogues = async (options = {}) => {
  const { search, limit = 10 } = options;

  const normalizedSearch =
    typeof search === "string" ? search.trim() || null : null;

  if (!normalizedSearch) {
    return [];
  }

  const normalizedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 10));

  const whereClause = {
    // status: "live",
    isDeleted: false,
  };

  const productWhereClause = {
    isDeleted: false,
    [Op.and]: [
      { isDeleted: false },
      {
        [Op.or]: [
          sequelize.literal(
            `"products"."search_vector" @@ plainto_tsquery('english', ${sequelize.escape(
              normalizedSearch,
            )})`,
          ),
          sequelize.literal(
            `similarity("products"."name", ${sequelize.escape(
              normalizedSearch,
            )}) > 0.3`,
          ),
        ],
      },
    ],
  };

  const catalogues = await Catalogue.findAll({
    where: whereClause,
    attributes: ["publicId", "name", "categoryId"],
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
      {
        model: Product,
        as: "products",
        where: productWhereClause,
        attributes: ["id"],
        required: true,
        include: [
          {
            model: ProductImage,
            as: "images",
            where: { isDeleted: false },
            attributes: ["imageUrl", "sortOrder", "isPrimary"],
            required: false,
          },
        ],
      },
    ],
    order: [["publicId", "DESC"]],
    limit: normalizedLimit,
  });

  return catalogues.map((catalogue) => ({
    publicId: catalogue.publicId,
    name: catalogue.name,
    category: catalogue.category
      ? {
          id: catalogue.category.id,
          name: catalogue.category.name,
          slug: catalogue.category.slug,
        }
      : null,
    imageUrl: pickRepresentativeImageUrl(catalogue),
  }));
};
