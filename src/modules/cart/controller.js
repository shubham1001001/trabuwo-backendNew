const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

exports.getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await service.getCart(userId);

  return apiResponse.success(res, cart, "Cart retrieved successfully");
});

exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productVariantId, quantity } = req.body;

  const cart = await service.addToCart(userId, productVariantId, quantity);
  return apiResponse.success(res, cart, "Item added to cart successfully");
});

exports.updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productVariantId } = req.params;
  const { quantity } = req.body;

  const cart = await service.updateCartItem(userId, productVariantId, quantity);
  return apiResponse.success(res, cart, "Cart item updated successfully");
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productVariantId } = req.params;

  const cart = await service.removeFromCart(userId, productVariantId);
  return apiResponse.success(res, cart, "Item removed from cart successfully");
});

exports.clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const cart = await service.clearCart(userId);
  return apiResponse.success(res, cart, "Cart cleared successfully");
});
