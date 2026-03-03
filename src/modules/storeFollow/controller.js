const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.followStore = async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user.id;

  await service.followStore(userId, storeId);
  return apiResponse.success(res, null, "Store followed successfully", 201);
};

exports.unfollowStore = async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user.id;

  const result = await service.unfollowStore(userId, storeId);
  return apiResponse.success(res, result, "Store unfollowed successfully");
};

exports.getUserFollowedStores = async (req, res) => {
  const userId = req.user.id;

  const followedStores = await service.getUserFollowedStores(userId);
  return apiResponse.success(
    res,
    followedStores,
    "Followed stores retrieved successfully"
  );
};

exports.getStoreFollowers = async (req, res) => {
  const { storeId } = req.params;

  const followers = await service.getStoreFollowers(storeId);
  return apiResponse.success(
    res,
    followers,
    "Store followers retrieved successfully"
  );
};

exports.checkUserFollowsStore = async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user.id;

  const result = await service.checkUserFollowsStore(userId, storeId);
  return apiResponse.success(
    res,
    result,
    "Follow status retrieved successfully"
  );
};

exports.getStoreFollowersCount = async (req, res) => {
  const { storeId } = req.params;

  const result = await service.getStoreFollowersCount(storeId);
  return apiResponse.success(
    res,
    result,
    "Followers count retrieved successfully"
  );
};

exports.getUserFollowsCount = async (req, res) => {
  const userId = req.user.id;

  const result = await service.getUserFollowsCount(userId);
  return apiResponse.success(
    res,
    result,
    "Follows count retrieved successfully"
  );
};

exports.getSellerStats = async (req, res) => {
  const { sellerPublicId } = req.params;

  const stats = await service.getSellerStats(sellerPublicId);
  return apiResponse.success(res, stats, "Seller stats retrieved successfully");
};
