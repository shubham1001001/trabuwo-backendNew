const service = require("./service");
const asyncHandler = require("../../utils/asyncHandler");
const apiResponse = require("../../utils/apiResponse");

exports.getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const wishlist = await service.getWishlist(userId);

  return apiResponse.success(res, wishlist, "Wishlist retrieved successfully");
});

exports.addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productPublicId } = req.body;

  const wishlistItem = await service.addToWishlist(userId, productPublicId);
  return apiResponse.success(
    res,
    wishlistItem,
    "Product added to wishlist successfully"
  );
});

exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productPublicId } = req.params;

  const result = await service.removeFromWishlist(userId, productPublicId);
  return apiResponse.success(res, result, "Product removed from wishlist successfully");
});

