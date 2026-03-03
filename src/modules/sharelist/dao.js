const SharelistItem = require("./model");
const Catalogue = require("../catalogue/model");
const { User } = require("../auth/model");
const Category = require("../category/model");
const { Product, ProductImage, ProductVariant } = require("../product/model");

exports.findSharelistItemsByUserId = (userId) => {
  return SharelistItem.findAll({
    where: { userId },
    attributes: ["createdAt"],
    include: [
      {
        model: Catalogue,
        as: "catalogue",
        where: { isDeleted: false },
        attributes: ["publicId", "name", "reviewsCount", "averageRating"],
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
          {
            model: Product,
            as: "products",
            where: { isDeleted: false },
            attributes: ["publicId", "name", "description", "status"],
            include: [
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
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

exports.findSharelistItemByUserAndCatalogue = (userId, catalogueId) => {
  return SharelistItem.findOne({
    where: { userId, catalogueId },
  });
};

exports.addToSharelist = (userId, catalogueId) => {
  return SharelistItem.create({ userId, catalogueId });
};
