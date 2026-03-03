const sequelize = require("../../config/database");

exports.getCategoryPriceStatsByPublicId = async (categoryPublicId) => {
  const [rows] = await sequelize.query(
    `
    SELECT
      cat.public_id               AS category_public_id,
      mv.cnt                      AS count,
      mv.min_price                AS min,
      mv.p10                      AS p10,
      mv.p25                      AS p25,
      mv.p50                      AS p50,
      mv.p75                      AS p75,
      mv.p90                      AS p90,
      mv.max_price                AS max
    FROM categories cat
    LEFT JOIN price_recommendations_mv mv
      ON mv.category_id = cat.id
    WHERE cat.public_id = :categoryPublicId
      AND cat.is_deleted = FALSE
    LIMIT 1
    `,
    { replacements: { categoryPublicId } }
  );
  return rows && rows.length ? rows[0] : null;
};
