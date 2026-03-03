const dao = require("./dao");

exports.getProductsMetrics = async (
  userId,
  filterType = null,
  sortBy = null,
  categoryId = null,
  skuId = null,
  page = 1,
  limit = 10
) => {
  return dao.getProductsMetrics(
    userId,
    filterType,
    sortBy,
    categoryId,
    skuId,
    page,
    limit
  );
};

exports.getTotalMetrics = async (userId, startDate, endDate) => {
  return dao.getTotalMetrics(userId, startDate, endDate);
};

exports.getWeeklyComparisonStats = async (userId) => {
  return dao.getWeeklyComparisonStats(userId);
};



// FIXED VERSION
exports.getDashboardCards = async (userId) => {
  return dao.getDashboardCards(userId);
};


exports.getSellerList = async (page, limit) => {
  return dao.getSellerList(page, limit);
};


exports.getBuyerList = async (page, limit) => {
  return dao.getBuyerList(page, limit);
};


exports.getOrderList = async (page, limit) => {
  return dao.getOrderList(page, limit);
};

exports.getDashboardSummary = async () => {
  return dao.getDashboardSummary();
};


exports.getDashboardRiskSummary = async () => {
  return dao.getDashboardRiskSummary();
};


exports.getPaymentOverview = async () => {
  return dao.getPaymentOverview();
};