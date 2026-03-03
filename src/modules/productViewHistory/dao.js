const { Op } = require("sequelize");
const sequelize = require("../../config/database");
const { ProductViewHistory } = require("./model");
const { Product, ProductImage, ProductVariant } = require("../product/model");
const Catalogue = require("../catalogue/model");
const Category = require("../category/model");

exports.upsertProductViewHistory = async (userId, productId, options = {}) => {
  return await ProductViewHistory.upsert(
    {
      userId,
      productId,
      viewedAt: new Date(),
    },
    options
  );
};

exports.getUserViewHistory = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const whereClause = {
    userId,
  };

  const includeOptions = [
    {
      model: Product,
      as: "product",
      where: { isDeleted: false },
      attributes: ["publicId", "name", "catalogueId"],
      required: true,
      include: [
        {
          model: ProductImage,
          as: "images",
          where: { isDeleted: false, isActive: true },
          attributes: ["imageUrl", "isPrimary", "sortOrder"],
          required: false,
          order: [
            ["isPrimary", "DESC"],
            ["sortOrder", "ASC"],
            ["createdAt", "ASC"],
          ],
        },
        {
          model: ProductVariant,
          as: "variants",
          where: { isDeleted: false, isActive: true },
          attributes: ["publicId", "trabuwoPrice", "mrp", "inventory", "skuId"],
          required: false,
        },
        {
          model: Catalogue,
          as: "catalogue",
          attributes: [
            "publicId",
            "name",
            "description",
            "status",
            "averageRating",
            "reviewsCount",
            "thumbnailUrl",
          ],
          required: false,
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "slug"],
              required: false,
            },
          ],
        },
      ],
    },
  ];

  const totalCount = await ProductViewHistory.count({
    where: whereClause,
    include: includeOptions,
    distinct: true,
  });

  const rows = await ProductViewHistory.findAll({
    where: whereClause,
    include: includeOptions,
    order: [["viewedAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  const products = rows
    .map((row) => row.product)
    .filter(Boolean)
    .map((product) => {
      const productData = {
        publicId: product.publicId,
        name: product.name,
        images: product.images || [],
        variants: product.variants || [],
        category: product.catalogue?.category || null,
        catalogue: product.catalogue || null,
      };
      return productData;
    });

  return {
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

exports.deleteOldViewHistory = async (daysOld = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const deletedCount = await ProductViewHistory.destroy({
    where: {
      viewedAt: {
        [Op.lt]: cutoffDate,
      },
    },
  });

  return { deletedCount };
};

exports.countOldViewHistory = async (daysOld = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const count = await ProductViewHistory.count({
    where: {
      viewedAt: {
        [Op.lt]: cutoffDate,
      },
    },
  });

  return count;
};

exports.getUserViewedCategorySlugs = async (userId, { limit = 10 } = {}) => {
  const rows = await ProductViewHistory.findAll({
    where: { userId },
    attributes: [
      [sequelize.col("product.catalogue.category.slug"), "slug"],
      [
        sequelize.fn("MAX", sequelize.col("ProductViewHistory.viewed_at")),
        "lastViewedAt",
      ],
    ],
    include: [
      {
        model: Product,
        as: "product",
        attributes: [],
        required: true,
        where: { isDeleted: false },
        include: [
          {
            model: Catalogue,
            as: "catalogue",
            attributes: [],
            required: true,
            where: { isDeleted: false },
            include: [
              {
                model: Category,
                as: "category",
                attributes: [],
                required: true,
                where: { isDeleted: false },
              },
            ],
          },
        ],
      },
    ],
    group: [sequelize.col("product->catalogue->category.slug")],
    order: [
      [
        sequelize.fn("MAX", sequelize.col("ProductViewHistory.viewed_at")),
        "DESC",
      ],
    ],
    limit: parseInt(limit, 10),
    raw: true,
  });

  return rows.map((r) => r.slug).filter(Boolean);
};
