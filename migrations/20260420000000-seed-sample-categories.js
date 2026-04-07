'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // We insert top-level categories first
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Electronics',
        slug: 'electronics',
        parent_id: null,
        is_visible: true,
        show_on_web: true,
        is_gold: false,
        display_order_web: 1,
        public_id: '019a876e-35d0-7497-853e-2f26e505c6b4',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Fashion',
        slug: 'fashion',
        parent_id: null,
        is_visible: true,
        show_on_web: true,
        is_gold: false,
        display_order_web: 2,
        public_id: '019a876e-35d0-7497-853e-2f26e505c6b5',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Gold Deals',
        slug: 'gold-deals',
        parent_id: null,
        is_visible: true,
        show_on_web: true,
        is_gold: true,
        display_order_web: 3,
        public_id: '019a876e-35d0-7497-853e-2f26e505c6b6',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Fetch the inserted IDs for children
    const [categories] = await queryInterface.sequelize.query("SELECT id, name FROM categories WHERE slug IN ('electronics', 'fashion')");
    const electronics = categories.find(c => c.name === 'Electronics');
    const fashion = categories.find(c => c.name === 'Fashion');

    if (electronics && fashion) {
      await queryInterface.bulkInsert('categories', [
        {
          name: 'Smartphones',
          slug: 'smartphones',
          parent_id: electronics.id,
          is_visible: true,
          show_on_web: true,
          is_gold: false,
          display_order_web: 1,
          public_id: '019a876e-35d0-7497-853e-2f26e505c6b7',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Mens Wear',
          slug: 'mens-wear',
          parent_id: fashion.id,
          is_visible: true,
          show_on_web: true,
          is_gold: false,
          display_order_web: 1,
          public_id: '019a876e-35d0-7497-853e-2f26e505c6b8',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', {
      slug: ['electronics', 'fashion', 'gold-deals', 'smartphones', 'mens-wear']
    }, {});
  }
};
