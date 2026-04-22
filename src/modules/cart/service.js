const dao = require("./dao");
const {
  NotFoundError,
  ValidationError,
  ConflictError,
} = require("../../utils/errors");

exports.getOrCreateCart = async (userId) => {
  const user = await dao.findUserById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  let cart = await dao.findCartByUserId(userId);
  if (!cart) {
    cart = await dao.createCart(userId);
  }

  return cart;
};

exports.addToCart = async (userId, productVariantId, quantity) => {
  const productVariant = await dao.findProductVariantByPublicId(
    productVariantId
  );
  if (!productVariant) {
    throw new NotFoundError(
      `Product variant with ID ${productVariantId} not found`
    );
  }

  if (!productVariant.isActive || productVariant.isDeleted) {
    throw new ValidationError("Product variant is not available");
  }

  if (productVariant.inventory < quantity) {
    throw new ConflictError("Insufficient stock available");
  }

  let cart = await dao.findCartByUserId(userId);
  if (!cart) {
    cart = await dao.createCart(userId);
  }

  const existingItem = await dao.findCartItem(cart.id, productVariantId);
  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (productVariant.inventory < newQuantity) {
      throw new ConflictError("Insufficient stock available");
    }
    await dao.updateCartItem(existingItem.id, newQuantity);
  } else {
    await dao.addItemToCart(cart.id, productVariant.id, quantity);
  }

  const updatedCart = await dao.getCartWithItems(cart.id);
  return addTotals(updatedCart);
};

exports.updateCartItem = async (userId, productVariantId, quantity) => {
  const user = await dao.findUserById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const productVariant = await dao.findProductVariantByPublicId(
    productVariantId
  );
  if (!productVariant) {
    throw new NotFoundError("Product variant not found");
  }

  if (productVariant.inventory < quantity) {
    throw new ConflictError("Insufficient stock available");
  }

  const cart = await dao.findCartByUserId(userId);
  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  const cartItem = await dao.findCartItem(cart.id, productVariantId);
  if (!cartItem) {
    throw new NotFoundError("Item not found in cart");
  }

  await dao.updateCartItem(cartItem.id, quantity);
  const updatedCart = await dao.getCartWithItems(cart.id);
  return addTotals(updatedCart);
};

exports.removeFromCart = async (userId, productVariantId) => {
  const cart = await dao.findCartByUserId(userId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  const cartItem = await dao.findCartItem(cart.id, productVariantId);
  if (!cartItem) {
    throw new NotFoundError("Item not found in cart");
  }

  await dao.removeCartItem(cartItem.id);
  const updatedCart = await dao.getCartWithItems(cart.id);
  return addTotals(updatedCart);
};

exports.clearCart = async (userId) => {
  const cart = await dao.findCartIdByUserId(userId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  await dao.clearCart(cart.id);
  const updatedCart = await dao.getCartWithItems(cart.id);
  return addTotals(updatedCart);
};

exports.getCart = async (userId) => {
  const cart = await dao.findCartByUserId(userId);

  if (!cart) {
    return {
      id: null,
      userId,
      status: "active",
      items: [],
      totalAmount: 0,
      itemCount: 0,
    };
  }

  return addTotals(cart);
};

exports.convertCartToOrder = async (userId) => {
  const cart = await dao.findCartByUserId(userId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  if (!cart.items || cart.items.length === 0) {
    throw new ValidationError("Cart is empty");
  }

  await dao.updateCart(cart.id, { status: "converted" });

  return cart;
};

function addTotals(cart) {
  if (!cart || !cart.items) {
    return {
      id: null,
      userId: cart?.userId,
      status: cart?.status || "active",
      items: [],
      totalAmount: 0,
      itemCount: 0,
    };
  }

  const totalAmount = cart.items.reduce((total, item) => {
    const priceNumber = Number(item.productVariant?.trabuwoPrice || 0);
    const safePrice = Number.isNaN(priceNumber) ? 0 : priceNumber;
    return total + safePrice * item.quantity;
  }, 0);

  const totalMRP = cart.items.reduce((total, item) => {
    const mrpNumber = Number(item.productVariant?.mrp || 0);
    const safeMRP = Number.isNaN(mrpNumber) ? 0 : mrpNumber;
    return total + safeMRP * item.quantity;
  }, 0);

  const totalDiscount = totalMRP - totalAmount;

  const itemCount = cart.items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const cartData = cart.toJSON ? cart.toJSON() : cart;

  return {
    ...cartData,
    totalAmount,
    totalMRP,
    totalDiscount,
    itemCount,
  };
}
