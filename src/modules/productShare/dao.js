const { ProductShare } = require("./model");
const { Product, ProductImage, ProductVariant } = require("../product/model");
const Catalogue = require("../catalogue/model");
const Category = require("../category/model");

exports.upsertProductShare = async (userId, productId) => {
  return ProductShare.upsert({ userId, productId, sharedAt: new Date() });
};

exports.findShareByUserAndProduct = (userId, productId) =>
  ProductShare.findOne({ where: { userId, productId } });

exports.getSharedProducts = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

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

  const totalCount = await ProductShare.count({
    where: { userId },
    include: includeOptions,
    distinct: true,
  });

  const rows = await ProductShare.findAll({
    where: { userId },
    include: includeOptions,
    order: [["sharedAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  const products = rows
    .map((row) => row.product)
    .filter(Boolean)
    .map((product) => ({
      publicId: product.publicId,
      name: product.name,
      images: product.images || [],
      variants: product.variants || [],
      category: product.catalogue?.category || null,
      catalogue: product.catalogue || null,
    }));

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
