'use strict';
const { v7: uuidv7 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Clear existing
    await queryInterface.bulkDelete('home_categories', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('category_sections', null, { truncate: true, cascade: true });

    // Get a valid category ID to link sections (model requires category_id)
    const [allCats] = await queryInterface.sequelize.query(`SELECT id, name FROM categories WHERE parent_id IS NULL LIMIT 1`);
    if (allCats.length === 0) return;
    const defaultCatId = allCats[0].id;

    // 1. Create Section (Corrected columns: name, category_id, layout, column)
    const [sections] = await queryInterface.sequelize.query(
      `INSERT INTO category_sections (public_id, name, category_id, layout, "column", display_order, is_active, created_at, updated_at) 
       VALUES 
       ('${uuidv7()}', 'Top Categories', ${defaultCatId}, 'horizontal', 6, 1, true, NOW(), NOW())
       RETURNING id`
    );
    const sectionId = sections[0].id;

    // 2. Map new Trabuwo categories to this section
    const [cats] = await queryInterface.sequelize.query(`SELECT id, name FROM categories WHERE parent_id IS NULL`);
    const catMap = {};
    cats.forEach(c => catMap[c.name] = c.id);

    const homeCats = [
      { name: 'Women Ethnic', order: 1, img: 'https://images.trabuwo.com/images/marketing/1649759774600.png' },
      { name: 'Men', order: 2, img: 'https://images.trabuwo.com/images/marketing/1649759700309.png' },
      { name: 'Kids', order: 3, img: 'https://images.trabuwo.com/images/marketing/1649759124479.png' },
      { name: 'Home & Kitchen', order: 4, img: 'https://images.trabuwo.com/images/marketing/1649759711674.png' },
      { name: 'Beauty & Health', order: 5, img: 'https://images.trabuwo.com/images/marketing/1649763038318.png' },
      { name: 'Jewellery & Accessories', order: 6, img: 'https://images.trabuwo.com/images/marketing/1649763013853.png' },
      { name: 'Electronics', order: 7, img: 'https://images.trabuwo.com/images/marketing/1649763024561.png' }
    ];

    for (const hc of homeCats) {
      if (catMap[hc.name]) {
        await queryInterface.sequelize.query(
          `INSERT INTO home_categories (public_id, name, section_id, redirect_category_id, img_url, display_order, is_active, show_on_home_page, created_at, updated_at) 
           VALUES ('${uuidv7()}', '${hc.name}', ${sectionId}, ${catMap[hc.name]}, '${hc.img}', ${hc.order}, true, true, NOW(), NOW())`
        );
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('home_categories', null, {});
    await queryInterface.bulkDelete('category_sections', null, {});
  }
};
