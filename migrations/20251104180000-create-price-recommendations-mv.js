"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW price_recommendations_mv AS
      WITH base AS (
        SELECT
          cat.id AS category_id,
          pv.trabuwo_price::numeric AS price
        FROM product_variants pv
        JOIN products p     ON p.id = pv.product_id        AND p.is_deleted = FALSE
        JOIN catalogues c   ON c.id = p.catalogue_id       AND c.is_deleted = FALSE
        JOIN categories cat ON cat.id = c.category_id      AND cat.is_deleted = FALSE
        WHERE pv.is_deleted = FALSE AND pv.is_active = TRUE AND pv.inventory > 0
      )
      SELECT
        category_id,
        COUNT(*) AS cnt,
        MIN(price) AS min_price,
        MAX(price) AS max_price,
        PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY price) AS p10,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price) AS p25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY price) AS p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price) AS p75,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY price) AS p90
      FROM base
      GROUP BY category_id;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX price_recommendations_mv_category_uidx
        ON price_recommendations_mv (category_id);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS price_recommendations_mv_category_uidx;
    `);
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS price_recommendations_mv;
    `);
  },
};
