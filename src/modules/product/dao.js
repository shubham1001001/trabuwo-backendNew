const { Product, ProductImage, ProductVariant } = require("./model");
const Catalogue = require("../catalogue/model");
const reviewDao = require("../review/dao");
const catalogueDao = require("../catalogue/dao");
const storeFollowDao = require("../storeFollow/dao");
const Category = require("../category/model");
const {
  SellerOnboarding,
  Address,
  Location,
  Store,
} = require("../sellerOnboarding/model");
const { User } = require("../auth/model");
const { Op } = require("sequelize");

exports.createProduct = (data, options = {}) => Product.create(data, options);

exports.createMultipleProducts = (products, options = {}) =>
  Product.bulkCreate(products, { ...options, individualHooks: true });

exports.getProductById = (id, userId, options = {}) =>
  Product.findOne({
    where: { publicId: id, isDeleted: false },
    include: [
      {
        model: Catalogue,
        as: "catalogue",
        attributes: ["id", "name", "userId"],
        where: { userId },
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: ProductImage,
        as: "images",
        where: { isDeleted: false },
        order: [
          ["sortOrder", "ASC"],
          ["createdAt", "ASC"],
        ],
      },
    ],
    ...options,
  });

exports.getProductByPublicId = (publicId, options = {}) =>
  Product.findOne({
    where: { publicId, isDeleted: false },
    include: [
      {
        model: Catalogue,
        as: "catalogue",
        attributes: ["id", "name"],
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    ...options,
  });

exports.getAllProducts = (filters = {}) => {
  const { categoryId, ...otherFilters } = filters;
  const whereClause = { isDeleted: false, ...otherFilters };

  const includeOptions = [
    {
      model: Catalogue,
      as: "catalogue",
      attributes: ["id", "name"],
      where: categoryId
        ? { categoryId, isDeleted: false }
        : { isDeleted: false },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
    },
    {
      model: ProductImage,
      as: "images",
      where: { isDeleted: false },
      order: [
        ["sortOrder", "ASC"],
        ["createdAt", "ASC"],
      ],
    },
  ];

  return Product.findAll({
    where: whereClause,
    include: includeOptions,
    order: [["createdAt", "DESC"]],
  });
};

exports.getProductsByCatalogueId = async (catalogueId, userId = null) => {
  const catalogue = await Catalogue.findOne({
    where: { publicId: catalogueId, isDeleted: false },
    include: [
      { model: Category, as: "category" },
      {
        model: Product,
        as: "products",
        include: [
          { model: ProductImage, as: "images" },
          { model: ProductVariant, as: "variants" },
        ],
      },
      {
        model: User,
        as: "seller",
        attributes: ["publicId", "email", "mobile"],
        include: [
          {
            model: SellerOnboarding,
            as: "sellerOnboarding",
            attributes: ["businessType"],
            include: [
              {
                model: Address,
                as: "address",
                attributes: ["buildingNumber", "street", "landmark"],
                include: [
                  {
                    model: Location,
                    as: "Location",
                    attributes: ["pincode", "city", "state"],
                  },
                ],
              },
              {
                model: Store,
                as: "store",
                attributes: ["id", "publicId", "name"],
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  if (!catalogue) return null;

  const ratingHistogram = await reviewDao.getCatalogueRatingHistogram(
    catalogueId,
    { shippedOnly: true }
  );

  catalogue.setDataValue("ratingHistogram", ratingHistogram);
  const totalReviews = Object.values(ratingHistogram).reduce(
    (sum, count) => sum + count,
    0
  );
  catalogue.setDataValue("totalReviews", totalReviews);

  const topHelpfulReviews = await reviewDao.getTopHelpfulReviewsByCatalogue(
    catalogueId,
    { shippedOnly: true, limit: 3 }
  );

  if (topHelpfulReviews && topHelpfulReviews.length > 0) {
    catalogue.setDataValue("topHelpfulReviews", topHelpfulReviews);
  }
  const storeStats = await catalogueDao.getSellerStatsByUserId(
    catalogue.userId
  );
  catalogue.setDataValue("storeStats", storeStats);

  if (userId && catalogue.seller?.sellerOnboarding?.store) {
    const store = catalogue.seller.sellerOnboarding.store;
    const storeFollow = await storeFollowDao.checkUserFollowsStore(
      userId,
      store.id
    );
    catalogue.setDataValue("isStoreFollowed", !!storeFollow);
  } else if (catalogue.seller?.sellerOnboarding?.store) {
    catalogue.setDataValue("isStoreFollowed", false);
  }

  return catalogue;
};

exports.getProductsByCategoryId = (categoryId) =>
  Product.findAll({
    where: { isDeleted: false },
    include: [
      {
        model: Catalogue,
        as: "catalogue",
        where: { categoryId, isDeleted: false },
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

exports.updateProductById = (id, data, options = {}) =>
  Product.update(data, { where: { id, isDeleted: false }, ...options });

exports.softDeleteProductById = (id, options = {}) =>
  Product.update({ isDeleted: true }, { where: { id }, ...options });

exports.getProductsByUserId = (userId) =>
  Product.findAll({
    where: { isDeleted: false },
    include: [
      {
        model: Catalogue,
        as: "catalogue",
        where: { userId },
        attributes: ["id", "name"],
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

/**
 * Create a new product image
 */
exports.createProductImage = async (imageData, options = {}) => {
  return await ProductImage.create(imageData, options);
};

exports.bulkCreateProductImages = async (imagesData, options = {}) => {
  return await ProductImage.bulkCreate(imagesData, options);
};

exports.getProductImagesByProductId = async (productId, options = {}) => {
  const where = {
    productId,
    isDeleted: false,
  };

  return await ProductImage.findAll({
    where,
    order: [
      ["sortOrder", "ASC"],
      ["createdAt", "ASC"],
    ],
    ...options,
  });
};

exports.getPrimaryProductImage = async (productId) => {
  return await ProductImage.findOne({
    where: {
      productId,
      isPrimary: true,
      isDeleted: false,
    },
  });
};

exports.getProductImageById = async (id) => {
  return await ProductImage.findOne({
    where: {
      id,
      isDeleted: false,
    },
  });
};

exports.updateProductImage = async (id, updateData, options = {}) => {
  const image = await ProductImage.findByPk(id);
  if (!image) {
    throw new Error("Product image not found");
  }
  return await image.update(updateData, options);
};

exports.softDeleteProductImage = async (id, options = {}) => {
  const image = await ProductImage.findByPk(id);
  if (!image) {
    throw new Error("Product image not found");
  }
  return await image.update({ isDeleted: true }, options);
};

exports.hardDeleteProductImage = async (id, options = {}) => {
  const image = await ProductImage.findByPk(id);
  if (!image) {
    throw new Error("Product image not found");
  }
  return await image.destroy(options);
};

exports.softDeleteProductImagesByProductId = async (
  productId,
  options = {}
) => {
  return await ProductImage.update(
    { isDeleted: true },
    {
      where: {
        productId,
        isDeleted: false,
      },
      ...options,
    }
  );
};

exports.setPrimaryProductImage = async (productId, imageId, options = {}) => {
  await ProductImage.update(
    { isPrimary: false },
    {
      where: {
        productId,
        isDeleted: false,
      },
      ...options,
    }
  );

  return await ProductImage.update(
    { isPrimary: true },
    {
      where: {
        id: imageId,
        productId,
        isDeleted: false,
      },
      ...options,
    }
  );
};

exports.reorderProductImages = async (productId, imageOrder, options = {}) => {
  const updates = imageOrder.map((imageId, index) => ({
    id: imageId,
    sortOrder: index,
  }));

  for (const update of updates) {
    await ProductImage.update(
      { sortOrder: update.sortOrder },
      {
        where: {
          id: update.id,
          productId,
          isDeleted: false,
        },
        ...options,
      }
    );
  }
};

/**
 * Bulk update products by id
 * @param {Array<{id: string, update: object}>} updates
 * @param {object} options
 */
exports.bulkUpdateProductsById = async (updates, options = {}) => {
  return await Promise.all(
    updates.map(({ id, update }) =>
      Product.update(update, { where: { id, isDeleted: false }, ...options })
    )
  );
};

/**
 * Soft delete all images for multiple products
 * @param {Array<string>} productIds
 * @param {object} options
 */
exports.softDeleteProductImagesByProductIds = async (
  productIds,
  options = {}
) => {
  return await ProductImage.update(
    { isDeleted: true },
    {
      where: {
        productId: productIds,
        isDeleted: false,
      },
      ...options,
    }
  );
};

// PublicId helpers
exports.getProductsByPublicIds = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return [];
  return await Product.findAll({
    attributes: ["id", "publicId"],
    where: { publicId: publicIds, isDeleted: false },
    include: [
      {
        model: Catalogue,
        as: "catalogue",
        attributes: ["userId"],
      },
    ],
  });
};

exports.getVariantsByPublicIds = async (variantPublicIds) => {
  if (!Array.isArray(variantPublicIds) || variantPublicIds.length === 0)
    return [];
  return await ProductVariant.findAll({
    attributes: ["id", "publicId", "productId"],
    where: { publicId: variantPublicIds, isDeleted: false },
  });
};

exports.getVariantByPublicId = async (publicId, options = {}) => {
  if (!publicId) return null;
  return await ProductVariant.findOne({
    attributes: [
      "id",
      "publicId",
      "productId",
      "trabuwoPrice",
      "inventory",
      "isActive",
      "isDeleted",
    ],
    where: { publicId, isDeleted: false },
    ...options,
  });
};

exports.getVariantsByProductIds = async (productIds) => {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  return await ProductVariant.findAll({
    attributes: ["id", "publicId", "productId"],
    where: { productId: productIds, isDeleted: false },
  });
};

exports.bulkUpsertProductVariants = async (rows, options = {}) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return await ProductVariant.bulkCreate(rows, {
    updateOnDuplicate: [
      "trabuwoPrice",
      "wrongDefectiveReturnPrice",
      "mrp",
      "inventory",
      "skuId",
      "dynamicFields",
    ],
    conflictFields: ["publicId"],
    returning: true,
    ...options,
  });
};

exports.bulkCreateProductVariants = async (variants, options = {}) => {
  return await ProductVariant.bulkCreate(variants, options);
};

exports.getProductVariantsByProductId = async (productId, options = {}) => {
  return await ProductVariant.findAll({
    where: { productId, isDeleted: false },
    ...options,
  });
};

exports.softDeleteProductVariantsByProductId = async (
  productId,
  options = {}
) => {
  return await ProductVariant.update(
    { isDeleted: true },
    {
      where: { productId, isDeleted: false },
      ...options,
    }
  );
};

exports.softDeleteProductVariantsNotIn = async (
  productId,
  keepIds,
  options = {}
) => {
  return await ProductVariant.update(
    { isDeleted: true },
    {
      where: {
        productId,
        id: { [Op.notIn]: keepIds && keepIds.length ? keepIds : [0] },
        isDeleted: false,
      },
      ...options,
    }
  );
};

exports.createProductVariant = async (
  sourceProductId,
  variantData,
  options = {}
) => {
  const productVariantData = {
    productId: sourceProductId,
    trabuwoPrice: variantData.trabuwoPrice,
    wrongDefectiveReturnPrice: variantData.wrongDefectiveReturnPrice,
    mrp: variantData.mrp,
    inventory: variantData.inventory,
    skuId: variantData.skuId,
    dynamicFields: variantData.dynamicFields,
  };
  const productVariant = await ProductVariant.create(
    productVariantData,
    options
  );
  return productVariant;
};

exports.getExistingProductsByCatalogue = async (catalogueId, options = {}) => {
  return await Product.findAll({
    where: { catalogueId, isDeleted: false },
    attributes: ["id", "publicId"],
    include: [
      {
        model: ProductImage,
        as: "images",
        where: { isDeleted: false },
        attributes: ["id", "publicId", "productId"],
        required: false,
      },
      {
        model: ProductVariant,
        as: "variants",
        where: { isDeleted: false },
        attributes: ["id", "publicId", "productId"],
        required: false,
      },
    ],
    ...options,
  });
};

exports.getExistingImagesByProductIds = async (productIds, options = {}) => {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  return await ProductImage.findAll({
    where: { productId: productIds, isDeleted: false },
    attributes: ["id", "publicId", "productId"],
    ...options,
  });
};

exports.getExistingVariantsByProductIds = async (productIds, options = {}) => {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  return await ProductVariant.findAll({
    where: { productId: productIds, isDeleted: false },
    attributes: ["id", "publicId", "productId"],
    ...options,
  });
};

exports.softDeleteProductsNotIn = async (
  catalogueId,
  keepIds,
  options = {}
) => {
  return await Product.update(
    { isDeleted: true },
    {
      where: {
        catalogueId,
        id: { [Op.notIn]: keepIds && keepIds.length ? keepIds : [0] },
        isDeleted: false,
      },
      ...options,
    }
  );
};

exports.softDeleteImagesByPublicIds = async (
  imageIdsToDelete,
  options = {}
) => {
  return await ProductImage.update(
    { isDeleted: true },
    {
      where: {
        publicId: {
          [Op.in]:
            imageIdsToDelete && imageIdsToDelete.length
              ? imageIdsToDelete
              : [0],
        },
        isDeleted: false,
      },
      ...options,
    }
  );
};

exports.softDeleteVariantsByPublicIds = async (
  variantIdsToDelete,
  options = {}
) => {
  return await ProductVariant.update(
    { isDeleted: true },
    {
      where: {
        publicId: {
          [Op.in]:
            variantIdsToDelete && variantIdsToDelete.length
              ? variantIdsToDelete
              : [0],
        },
        isDeleted: false,
      },
      ...options,
    }
  );
};

exports.bulkUpsertProducts = async (products, options = {}) => {
  if (!Array.isArray(products) || products.length === 0) return [];
  return await Product.bulkCreate(products, {
    updateOnDuplicate: [
      "name",
      "styleCode",
      "manufacturerName",
      "manufacturerPincode",
      "manufacturerAddress",
      "countryOfOrigin",
      "packerName",
      "packerAddress",
      "packerPincode",
      "importerName",
      "importerAddress",
      "importerPincode",
      "description",
      "dynamicFields",
    ],
    conflictFields: ["publicId"],
    returning: true,
    ...options,
  });
};

exports.bulkUpsertProductImages = async (images, options = {}) => {
  if (!Array.isArray(images) || images.length === 0) return [];
  return await ProductImage.bulkCreate(images, {
    updateOnDuplicate: [
      "imageUrl",
      "imageKey",
      "altText",
      "caption",
      "sortOrder",
      "isPrimary",
    ],
    conflictFields: ["publicId"],
    returning: true,
    ...options,
  });
};
