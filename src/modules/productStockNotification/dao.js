const ProductStockNotification = require("./model");
const { ProductVariant, Product, ProductImage } = require("../product/model");
const Catalogue = require("../catalogue/model");
const Category = require("../category/model");
const { User } = require("../auth/model");

exports.findNotificationByUserAndVariant = (userId, productVariantId) => {
  return ProductStockNotification.findOne({
    where: { userId, productVariantId, isActive: true },
  });
};

exports.findActiveNotificationsByVariantId = (productVariantId) => {
  return ProductStockNotification.findAll({
    where: { productVariantId, isActive: true, isNotified: false },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "publicId", "email", "mobile"],
      },
    ],
  });
};

exports.findPendingNotificationsByVariant = (
  productVariantId,
  limit,
  offset
) => {
  return ProductStockNotification.findAll({
    where: { productVariantId, isActive: true, isNotified: false },
    attributes: ["id", "publicId", "userId", "createdAt"],
    order: [["createdAt", "ASC"]],
    limit,
    offset,
  });
};

exports.createNotification = (data) => {
  return ProductStockNotification.create(data);
};

exports.findNotificationsByUserId = (userId) => {
  return ProductStockNotification.findAll({
    where: { userId, isActive: true },
    attributes: ["publicId", "isNotified", "notifiedAt", "createdAt"],
    include: [
      {
        model: ProductVariant,
        as: "productVariant",
        where: { isDeleted: false },
        attributes: ["publicId", "trabuwoPrice", "mrp", "inventory", "skuId"],
        include: [
          {
            model: Product,
            as: "product",
            where: { isDeleted: false },
            attributes: ["publicId", "name", "description", "status"],
            include: [
              {
                model: Catalogue,
                as: "catalogue",
                attributes: ["publicId", "name", "status", "thumbnailUrl"],
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
                where: { isDeleted: false, isActive: true },
                attributes: ["imageUrl", "isPrimary", "sortOrder"],
                order: [
                  ["isPrimary", "DESC"],
                  ["sortOrder", "ASC"],
                  ["createdAt", "ASC"],
                ],
                limit: 1,
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

exports.findNotificationByPublicId = (publicId, userId) => {
  return ProductStockNotification.findOne({
    where: { publicId, userId, isActive: true },
  });
};

exports.deactivateNotification = (id) => {
  return ProductStockNotification.update(
    { isActive: false },
    { where: { id } }
  );
};

exports.markAsNotified = (id) => {
  return ProductStockNotification.update(
    { isNotified: true, notifiedAt: new Date() },
    { where: { id } }
  );
};
