const sequelize = require("../../config/database");
const { QueryTypes } = require("sequelize");
const { Review, ReviewImage, ReviewHelpful } = require("./model");
const { Product, ProductVariant } = require("../product/model");
const { OrderItem, Order } = require("../order/model");
const Catalogue = require("../catalogue/model");
const { User } = require("../auth/model");
const { Store, SellerOnboarding } = require("../sellerOnboarding/model");

exports.findOne = async (where) => {
  return Review.findOne({
    where,
    include: [
      {
        model: ReviewImage,
        as: "images",
        where: { isDeleted: false },
        required: false,
      },
    ],
  });
};

exports.getById = async (id) => {
  return Review.findOne({
    where: { id, isDeleted: false },
    include: [
      {
        model: ReviewImage,
        as: "images",
        where: { isDeleted: false },
        required: false,
      },
    ],
  });
};

exports.create = async (reviewData, images = []) => {
  return sequelize.transaction(async (t) => {
    const created = await Review.create(reviewData, { transaction: t });
    if (Array.isArray(images) && images.length > 0) {
      const imageRows = images.map((img) => ({ ...img, reviewId: created.id }));
      await ReviewImage.bulkCreate(imageRows, { transaction: t });
    }
    return created;
  });
};

exports.update = async (id, updates, images = null) => {
  return sequelize.transaction(async (t) => {
    await Review.update(updates, { where: { id }, transaction: t });
    if (images) {
      await ReviewImage.update(
        { isDeleted: true },
        { where: { reviewId: id }, transaction: t }
      );
      if (images.length > 0) {
        const rows = images.map((img) => ({ ...img, reviewId: id }));
        await ReviewImage.bulkCreate(rows, { transaction: t });
      }
    }
    return Review.findOne({
      where: { id },
      include: [
        {
          model: ReviewImage,
          as: "images",
          where: { isDeleted: false },
          required: false,
        },
      ],
      transaction: t,
    });
  });
};

exports.softDelete = async (id) => {
  return sequelize.transaction(async (t) => {
    await Review.update({ isDeleted: true }, { where: { id }, transaction: t });
    await ReviewImage.update(
      { isDeleted: true },
      { where: { reviewId: id }, transaction: t }
    );
    await ReviewHelpful.destroy({ where: { reviewId: id }, transaction: t });
  });
};

exports.listByProduct = async (
  productId,
  { page = 1, limit = 10, sort = "newest" } = {}
) => {
  const product = await Product.findOne({
    where: { publicId: productId, isDeleted: false },
  });

  if (!product) {
    return { rows: [], count: 0, page, limit };
  }

  const offset = (page - 1) * limit;
  const order =
    sort === "highest"
      ? [
          ["rating", "DESC"],
          ["createdAt", "DESC"],
        ]
      : sort === "lowest"
      ? [
          ["rating", "ASC"],
          ["createdAt", "DESC"],
        ]
      : [["createdAt", "DESC"]];

  const { rows, count } = await Review.findAndCountAll({
    where: { isDeleted: false },
    attributes: [
      "publicId",
      "rating",
      "helpfulCount",
      "text",
      "title",
      "createdAt",
    ],
    include: [
      {
        model: OrderItem,
        as: "orderItem",
        attributes: [],
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
            attributes: [],
            include: [
              {
                model: Product,
                as: "product",
                where: { id: product.id, isDeleted: false },
                attributes: [],
              },
            ],
          },
        ],
      },
      {
        model: ReviewImage,
        as: "images",
        where: { isDeleted: false },
        required: false,
        attributes: ["imageUrl", "sortOrder"],
      },
      {
        model: User,
        as: "reviewer",
        required: false,
        attributes: ["publicId", "email"],
      },
    ],
    order,
    offset,
    limit,
  });
  return { rows, count, page, limit };
};

exports.addHelpfulVote = async (reviewId, userId) => {
  return sequelize.transaction(async (t) => {
    await ReviewHelpful.create({ reviewId, userId }, { transaction: t });
    await Review.increment(
      { helpfulCount: 1 },
      { where: { id: reviewId }, transaction: t }
    );
  });
};

exports.removeHelpfulVote = async (reviewId, userId) => {
  return sequelize.transaction(async (t) => {
    const deleted = await ReviewHelpful.destroy({
      where: { reviewId, userId },
      transaction: t,
    });
    if (deleted) {
      await Review.decrement(
        { helpfulCount: 1 },
        { where: { id: reviewId }, transaction: t }
      );
    }
  });
};

exports.listByUser = async (reviewerId, { page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await Review.findAndCountAll({
    where: { reviewerId, isDeleted: false },
    include: [
      {
        model: ReviewImage,
        as: "images",
        where: { isDeleted: false },
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
    offset,
    limit,
  });
  return { rows, count, page, limit };
};

exports.getProductsWithMostHelpfulReview = async () => {
  return Product.findAll({
    where: { isDeleted: false, isActive: true },
    include: [
      {
        model: ProductVariant,
        as: "variants",
        include: [
          {
            model: OrderItem,
            as: "orderItems",
            include: [
              {
                model: Review,
                as: "review",
                where: { isDeleted: false },
                required: false,
                order: [
                  ["helpfulCount", "DESC"],
                  ["rating", "ASC"],
                  ["createdAt", "DESC"],
                ],
                limit: 1,
              },
            ],
          },
        ],
      },
    ],
    order: [["name", "ASC"]],
  });
};

exports.getCatalogueRatingHistogram = async (
  cataloguePublicId,
  { shippedOnly = false } = {}
) => {
  const shipped_join = shippedOnly
    ? `JOIN orders o ON o.id = oi.order_id AND o.status = 'shipped'`
    : "";

  const sql = `
    WITH rating_buckets AS (
      SELECT generate_series(1, 5) AS rating
    ),
    counts AS (
      SELECT r.rating, COUNT(*)::BIGINT AS count
      FROM catalogues c
      JOIN products p ON p.catalogue_id = c.id AND p.is_deleted = false
      JOIN product_variants pv ON pv.product_id = p.id AND pv.is_deleted = false
      JOIN order_items oi ON oi.product_variant_id = pv.id
      ${shipped_join}
      JOIN reviews r ON r.order_item_id = oi.id AND r.is_deleted = false
      WHERE c.public_id = :cataloguePublicId
      GROUP BY r.rating
    )
    SELECT rb.rating, COALESCE(c.count, 0) AS count
    FROM rating_buckets rb
    LEFT JOIN counts c ON c.rating = rb.rating
    ORDER BY rb.rating;
  `;

  const rows = await sequelize.query(sql, {
    replacements: { cataloguePublicId },
    type: QueryTypes.SELECT,
  });

  const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) {
    result[row.rating] = Number(row.count) || 0;
  }
  return result;
};

exports.getTopHelpfulReviewsByCatalogue = async (
  cataloguePublicId,
  { shippedOnly = true, limit = 3 } = {}
) => {
  const orderWhere = shippedOnly ? { status: "shipped" } : {};

  const reviews = await Review.findAll({
    where: { isDeleted: false },
    attributes: [
      "publicId",
      "rating",
      "title",
      "text",
      "helpfulCount",
      "createdAt",
    ],
    include: [
      {
        model: OrderItem,
        as: "orderItem",
        required: true,
        include: [
          {
            model: Order,
            as: "order",
            where: orderWhere,
            required: true,
            attributes: [],
          },
          {
            model: ProductVariant,
            as: "productVariant",
            required: true,
            include: [
              {
                model: Product,
                as: "product",
                where: { isDeleted: false },
                required: true,
                include: [
                  {
                    model: Catalogue,
                    as: "catalogue",
                    where: { publicId: cataloguePublicId, isDeleted: false },
                    required: true,
                    attributes: [],
                  },
                ],
                attributes: [],
              },
            ],
            attributes: [],
          },
        ],
        attributes: [],
      },
      {
        model: ReviewImage,
        as: "images",
        where: { isDeleted: false },
        required: false,
        attributes: ["publicId", "imageUrl", "altText", "sortOrder"],
        order: [
          ["sortOrder", "ASC"],
          ["createdAt", "ASC"],
        ],
      },
      {
        model: User,
        as: "reviewer",
        required: false,
        attributes: ["publicId", "email"],
      },
    ],
    order: [
      ["helpfulCount", "DESC"],
      ["createdAt", "DESC"],
    ],
    limit,
  });

  return reviews;
};

exports.listByStore = async (storePublicId, { page = 1, limit = 10 } = {}) => {
  const store = await Store.findOne({
    where: { publicId: storePublicId },
    include: [
      {
        model: SellerOnboarding,
        as: "sellerOnboarding",
        required: true,
        include: [
          {
            model: User,
            as: "user",
            required: true,
            attributes: ["id"],
          },
        ],
      },
    ],
  });

  if (!store || !store.sellerOnboarding || !store.sellerOnboarding.user) {
    return { rows: [], count: 0, page, limit };
  }

  const userId = store.sellerOnboarding.user.id;
  const offset = (page - 1) * limit;

  const { rows, count } = await Review.findAndCountAll({
    where: { isDeleted: false },
    attributes: [
      "publicId",
      "rating",
      "helpfulCount",
      "text",
      "title",
      "createdAt",
    ],
    include: [
      {
        model: OrderItem,
        as: "orderItem",
        required: true,
        attributes: [],
        include: [
          {
            model: Order,
            as: "order",
            where: { status: "shipped" },
            required: true,
            attributes: [],
          },
          {
            model: ProductVariant,
            as: "productVariant",
            required: true,
            attributes: [],
            include: [
              {
                model: Product,
                as: "product",
                where: { isDeleted: false },
                required: true,
                attributes: [],
                include: [
                  {
                    model: Catalogue,
                    as: "catalogue",
                    where: { userId, isDeleted: false },
                    required: true,
                    attributes: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        model: ReviewImage,
        as: "images",
        where: { isDeleted: false },
        required: false,
        attributes: ["imageUrl", "sortOrder"],
        order: [
          ["sortOrder", "ASC"],
          ["createdAt", "ASC"],
        ],
      },
      {
        model: User,
        as: "reviewer",
        required: false,
        attributes: ["publicId", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    offset,
    limit,
  });

  return { rows, count, page, limit };
};

exports.getStoreRatingHistogram = async (
  storePublicId,
  { shippedOnly = true } = {}
) => {
  const store = await Store.findOne({
    where: { publicId: storePublicId },
    include: [
      {
        model: SellerOnboarding,
        as: "sellerOnboarding",
        required: true,
        include: [
          {
            model: User,
            as: "user",
            required: true,
            attributes: ["id"],
          },
        ],
      },
    ],
  });

  if (!store || !store.sellerOnboarding || !store.sellerOnboarding.user) {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }

  const userId = store.sellerOnboarding.user.id;
  const shipped_join = shippedOnly
    ? `JOIN orders o ON o.id = oi.order_id AND o.status = 'shipped'`
    : "";

  const sql = `
    WITH rating_buckets AS (
      SELECT generate_series(1, 5) AS rating
    ),
    counts AS (
      SELECT r.rating, COUNT(*)::BIGINT AS count
      FROM catalogues c
      JOIN products p ON p.catalogue_id = c.id AND p.is_deleted = false
      JOIN product_variants pv ON pv.product_id = p.id AND pv.is_deleted = false
      JOIN order_items oi ON oi.product_variant_id = pv.id
      ${shipped_join}
      JOIN reviews r ON r.order_item_id = oi.id AND r.is_deleted = false
      WHERE c.user_id = :userId
      AND c.is_deleted = false
      GROUP BY r.rating
    )
    SELECT rb.rating, COALESCE(c.count, 0) AS count
    FROM rating_buckets rb
    LEFT JOIN counts c ON c.rating = rb.rating
    ORDER BY rb.rating;
  `;

  const rows = await sequelize.query(sql, {
    replacements: { userId },
    type: QueryTypes.SELECT,
  });

  const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) {
    result[row.rating] = Number(row.count) || 0;
  }
  return result;
};
