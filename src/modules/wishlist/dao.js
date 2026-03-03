const WishlistItem = require("./model");
const { Product, ProductImage, ProductVariant } = require("../product/model");
const Catalogue = require("../catalogue/model");
const Category = require("../category/model");
const { User } = require("../auth/model");

exports.findWishlistItemsByUserId = (userId) => {
  return WishlistItem.findAll({
    where: { userId },
    attributes: ["publicId", "createdAt"],
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
                model: User,
                as: "seller",
                attributes: ["publicId"],
              },
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
          },
          {
            model: ProductVariant,
            as: "variants",
            where: { isDeleted: false, isActive: true },
            attributes: [
              "publicId",
              "trabuwoPrice",
              "mrp",
              "inventory",
              "skuId",
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

exports.findWishlistItemByIdWithProduct = (wishlistItemId) => {
  return WishlistItem.findByPk(wishlistItemId, {
    attributes: ["publicId", "createdAt"],
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
                model: User,
                as: "seller",
                attributes: ["publicId"],
              },
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
          },
          {
            model: ProductVariant,
            as: "variants",
            where: { isDeleted: false, isActive: true },
            attributes: [
              "publicId",
              "trabuwoPrice",
              "mrp",
              "inventory",
              "skuId",
            ],
          },
        ],
      },
    ],
  });
};

exports.findWishlistItemByUserAndProduct = (userId, productId) => {
  return WishlistItem.findOne({
    where: { userId, productId },
  });
};

exports.addToWishlist = (userId, productId) => {
  return WishlistItem.create({
    userId,
    productId,
  });
};

exports.removeFromWishlistByUserAndProduct = (userId, productId) => {
  return WishlistItem.destroy({
    where: { userId, productId },
  });
};
