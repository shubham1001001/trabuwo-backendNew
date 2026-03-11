const service = require("./service");
const apiResponse = require("../../utils/apiResponse");

exports.getProductsMetrics = async (req, res) => {
  const {
    filterType,
    sortBy,
    categoryId,
    skuId,
    page = 1,
    limit = 10,
  } = req.query;
  const userId = req.user.id;

  const data = await service.getProductsMetrics(
    userId,
    filterType,
    sortBy,
    categoryId,
    skuId,
    parseInt(page),
    parseInt(limit)
  );

  return apiResponse.success(
    res,
    data,
    "Products metrics retrieved successfully"
  );
};

exports.getTotalMetrics = async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.user.id;
  const data = await service.getTotalMetrics(userId, startDate, endDate);
  return apiResponse.success(res, data, "Total metrics retrieved successfully");
};

exports.getWeeklyComparisonStats = async (req, res) => {
  const userId = req.user.id;
  const data = await service.getWeeklyComparisonStats(userId);
  return apiResponse.success(
    res,
    data,
    "Weekly comparison stats retrieved successfully"
  );
};




exports.getDashboardCards = async (req, res) => {
  const userId = req.user.id;

  const data = await service.getDashboardCards(userId);

  return apiResponse.success(
    res,
    data,
    "Dashboard cards retrieved successfully"
  );
};


exports.getSellerList = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const data = await service.getSellerList(
    Number(page),
    Number(limit)
  );

  return apiResponse.success(
    res,
    data,
    "Seller list retrieved successfully"
  );
};

exports.getBuyerList = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const data = await service.getBuyerList(
    Number(page),
    Number(limit)
  );

  return apiResponse.success(
    res,
    data,
    "Buyer list retrieved successfully"
  );
};


exports.getOrderList = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const data = await service.getOrderList(
    Number(page),
    Number(limit)
  );

  return apiResponse.success(
    res,
    data,
    "Order list retrieved successfully"
  );
};


exports.getDashboardSummary = async (req, res) => {
  const data = await service.getDashboardSummary();

  return apiResponse.success(
    res,
    data,
    "Dashboard order summary retrieved successfully"
  );
};


exports.getDashboardRiskSummary = async (req, res) => {
  const data = await service.getDashboardRiskSummary();

  return apiResponse.success(
    res,
    data,
    "Dashboard risk summary retrieved successfully"
  );
};


exports.getPaymentOverview = async (req, res) => {
  const data = await service.getPaymentOverview();

  return apiResponse.success(
    res,
    data,
    "Payment overview retrieved successfully"
  );
};


exports.getDashboardGraph = async (req, res) => {
  const data = await service.getDashboardGraph();
  return apiResponse.success(
    res,
    data,
    "Dashboard graph retrieved successfully"
  );
};


exports.getTopSellingCategories = async (req, res, next) => {
  try {

    const { limit = 5 } = req.query;

    const result = await service.getTopSellingCategories({
      limit: Number(limit)
    });

    return apiResponse.success(
      res,
      result,
      "Top selling categories retrieved successfully"
    );

  } catch (error) {
    next(error);
  }
};