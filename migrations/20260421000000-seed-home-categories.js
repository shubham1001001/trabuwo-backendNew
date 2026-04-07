'use strict';
const { v7: uuidv7 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fetch some real category IDs to link to
    const [categories] = await queryInterface.sequelize.query("SELECT id, name FROM categories WHERE slug IN ('electronics', 'fashion', 'gold-deals', 'smartphones', 'mens-wear')");
    
    const electronics = categories.find(c => c.name === 'Electronics');
    const fashion = categories.find(c => c.name === 'Fashion');
    const goldDeals = categories.find(c => c.name === 'Gold Deals');

    if (electronics && fashion && goldDeals) {
      await queryInterface.bulkInsert('home_categories', [
        {
          public_id: uuidv7(),
          name: 'Top Electronics',
          redirect_category_id: electronics.id,
          display_order: 1,
          is_active: true,
          show_on_home_page: true,
          device_type: 'both',
          img_url: 'trabuwo-staging.s3.ap-south-1.amazonaws.com/categories/electronics_home.png',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          public_id: uuidv7(),
          name: 'Latest Fashion',
          redirect_category_id: fashion.id,
          display_order: 2,
          is_active: true,
          show_on_home_page: true,
          device_type: 'both',
          img_url: 'trabuwo-staging.s3.ap-south-1.amazonaws.com/categories/fashion_home.png',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          public_id: uuidv7(),
          name: 'Premium Deals',
          redirect_category_id: goldDeals.id,
          display_order: 3,
          is_active: true,
          show_on_home_page: true,
          device_type: 'both',
          img_url: 'trabuwo-staging.s3.ap-south-1.amazonaws.com/categories/gold_home.png',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('home_categories', null, {});
  }
};
