const dao = require("./dao");

exports.getRecommendationByCategoryPublicId = async (categoryPublicId) => {
  const row = await dao.getCategoryPriceStatsByPublicId(categoryPublicId);

  if (!row || !row.count || Number(row.count) === 0) {
    return {
      categoryId: categoryPublicId,
      count: 0,
      min: null,
      p10: null,
      p25: null,
      p50: null,
      p75: null,
      p90: null,
      max: null,
      suggestedPrice: null,
    };
  }

  const response = {
    categoryId: row.category_public_id,
    count: Number(row.count),
    min: row.min,
    p10: row.p10,
    p25: row.p25,
    p50: row.p50,
    p75: row.p75,
    p90: row.p90,
    max: row.max,
    suggestedPrice: row.p50,
  };

  return response;
};
