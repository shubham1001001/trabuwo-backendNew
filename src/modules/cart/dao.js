const { Cart, CartItem } = require("./model");
const { ProductVariant, Product, ProductImage } = require("../product/model");
const { User } = require("../auth/model");

exports.createCart = (userId) => {
  return Cart.create({ userId });
};

exports.findCartIdByUserId = (userId, status = "active") => {
  return Cart.findOne({
    where: { userId, status },
    attributes: ["id"],
  });
};

exports.findCartByUserId = (userId, status = "active") => {
  return Cart.findOne({
    where: { userId, status },
    attributes: ["id", "publicId"],
    include: [
      {
        model: CartItem,
        as: "items",
        attributes: ["publicId", "quantity", "productVariantId"],
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
            attributes: [
              "publicId",
              "trabuwoPrice",
              "inventory",
              "skuId",
              "dynamicFields",
            ],
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["name", "publicId"],
                include: [
                  {
                    model: ProductImage,
                    as: "images",
                    attributes: ["imageUrl"],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
};

exports.findCartById = (cartId) => {
  return Cart.findByPk(cartId, {
    include: [
      {
        model: CartItem,
        as: "items",
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
            attributes: ["publicId", "trabuwoPrice", "inventory", "skuId"],
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["name", "publicId"],
              },
            ],
          },
        ],
      },
    ],
  });
};

exports.updateCart = (cartId, data) => {
  return Cart.update(data, { where: { id: cartId } });
};

exports.deleteCart = (cartId) => {
  return Cart.destroy({ where: { id: cartId } });
};

exports.addItemToCart = (cartId, productVariantId, quantity) => {
  return CartItem.create({
    cartId,
    productVariantId,
    quantity,
  });
};

exports.findCartItem = async (cartId, productVariantId) => {
  const productVariant = await exports.findProductVariantByPublicId(
    productVariantId
  );
  return CartItem.findOne({
    where: { cartId, productVariantId: productVariant.id },
  });
};

exports.updateCartItem = (cartItemId, quantity) => {
  return CartItem.update({ quantity }, { where: { id: cartItemId } });
};

exports.removeCartItem = (cartItemId) => {
  return CartItem.destroy({ where: { id: cartItemId } });
};

exports.clearCart = (cartId) => {
  return CartItem.destroy({ where: { cartId } });
};

exports.getCartWithItems = (cartId) => {
  return Cart.findByPk(cartId, {
    exclude: ["createdAt", "updatedAt", "id"],
    include: [
      {
        model: CartItem,
        as: "items",
        exclude: [
          "createdAt",
          "updatedAt",
          "id",
          "userId",
          "cartId",
          "productVariantId",
        ],
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
            attributes: ["publicId", "trabuwoPrice", "inventory", "skuId"],
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["name", "publicId"],
              },
            ],
          },
        ],
      },
    ],
  });
};

exports.findProductVariantById = (productVariantId) => {
  return ProductVariant.findByPk(productVariantId);
};

exports.findProductVariantByPublicId = (productVariantId) => {
  return ProductVariant.findOne({
    where: { publicId: productVariantId, isDeleted: false },
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["publicId", "name", "publicId", "status", "isDeleted"],
      },
    ],
  });
};

exports.findUserById = (userId) => {
  return User.findByPk(userId);
};
