const service = require("./service");
const { success } = require("../../utils/apiResponse");

exports.getCategoryRecommendations = async (req, res) => {
  const { categoryId } = req.query;
  const data = await service.getRecommendationByCategoryPublicId(categoryId);
  return success(res, data, "Price recommendations retrieved successfully");
};
