const dao = require("./dao");
const { NotFoundError } = require("../../utils/errors");

exports.followStore = async (userId, storePublicId) => {
  const store = await dao.findStoreByPublicId(storePublicId);

  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const storeFollow = await dao.createStoreFollow({
    userId,
    storeId: store.id,
  });

  return storeFollow;
};

exports.unfollowStore = async (userId, storePublicId) => {
  const store = await dao.findStoreByPublicId(storePublicId);
  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const existingFollow = await dao.getStoreFollow(userId, store.id);
  if (!existingFollow) {
    throw new NotFoundError("You are not following this store");
  }

  await dao.deleteStoreFollow(userId, store.id);

  return { message: "Successfully unfollowed store" };
};

exports.getUserFollowedStores = async (userId) => {
  const followedStores = await dao.getUserFollowedStores(userId);
  return followedStores;
};

exports.getStoreFollowers = async (storePublicId) => {
  const store = await dao.findStoreByPublicId(storePublicId);
  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const followers = await dao.getStoreFollowers(store.id);
  return followers;
};

exports.checkUserFollowsStore = async (userId, storePublicId) => {
  const store = await dao.findStoreByPublicId(storePublicId);
  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const followExists = await dao.checkUserFollowsStore(userId, store.id);
  return { isFollowing: !!followExists };
};

exports.getStoreFollowersCount = async (storePublicId) => {
  const store = await dao.findStoreByPublicId(storePublicId);
  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const count = await dao.getStoreFollowersCount(store.id);
  return { followersCount: count };
};

exports.getUserFollowsCount = async (userId) => {
  const count = await dao.getUserFollowsCount(userId);
  return { followsCount: count };
};

exports.getSellerStats = async (sellerPublicId) => {
  const stats = await dao.getSellerStatsBySellerPublicId(sellerPublicId);
  if (!stats) {
    throw new NotFoundError("Seller not found");
  }
  return stats;
};
