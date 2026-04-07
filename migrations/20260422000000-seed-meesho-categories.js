'use strict';
const { v7: uuidv7 } = require("uuid");
const slugify = (text) => text.toString().toLowerCase().trim().replace(/&/g, 'and').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Clear everything first
    await queryInterface.bulkDelete('home_categories', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('category_sections', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('categories', null, { truncate: true, cascade: true });

    const categories = [
      { name: "Popular", sub: [{ name: "All Popular", leaf: ["Jewellery", "Men Fashion", "Kids", "Footwear", "Electronics"] }] },
      { name: "Kurti, Saree & Lehenga", sub: [
          { name: "All Women Ethnic", leaf: ["Sarees", "Kurtis", "Kurta Sets", "Suits", "Lehengas"] },
          { name: "Sarees", leaf: ["Silk", "Cotton", "Georgette", "Chiffon", "Satin"] },
          { name: "Kurtis", leaf: ["Anarkali", "Rayon", "Cotton", "Embroidered"] }
        ] 
      },
      { name: "Women Western", sub: [{ name: "Topwear", leaf: ["Tops", "Dresses", "Gowns"] }, { name: "Bottomwear", leaf: ["Jeans", "Jeggings", "Palazzos"] }] },
      { name: "Lingerie", sub: [{ name: "Innerwear", leaf: ["Bra", "Briefs", "Slips"] }, { name: "Sleepwear", leaf: ["Babydolls", "Nightsuits"] }] },
      { name: "Men", sub: [{ name: "Topwear", leaf: ["Shirts", "Tshirts", "Polos"] }, { name: "Bottomwear", leaf: ["Jeans", "Trousers", "Track Pants"] }] },
      { name: "Kids & Toys", sub: [{ name: "Boys", leaf: ["Tshirts", "Jeans"] }, { name: "Girls", leaf: ["Dresses", "Tops"] }, { name: "Toys", leaf: ["Action Figures", "Board Games"] }] },
      { name: "Home & Kitchen", sub: [{ name: "Home Decor", leaf: ["Wall Clocks", "Vases"] }, { name: "Kitchen", leaf: ["Cookware", "Tools"] }] },
      { name: "Beauty & Health", sub: [{ name: "Makeup", leaf: ["Lipstick", "Nail Polish"] }, { name: "Skincare", leaf: ["Cleansers", "Moisturizers"] }] },
      { name: "Jewellery & Accessories", sub: [{ name: "Jewellery", leaf: ["Earrings", "Necklaces"] }, { name: "Bags", leaf: ["Handbags", "Sling Bags"] }] },
      { name: "Bags & Footwear", sub: [{ name: "Women", leaf: ["Flats", "Heels"] }, { name: "Men", leaf: ["Sports", "Casual"] }] },
      { name: "Electronics", sub: [{ name: "Mobiles", leaf: ["Smartphones", "Covers"] }, { name: "Appliances", leaf: ["Fans", "Irons"] }] },
      { name: "Watches", sub: [{ name: "Men Watches", leaf: ["Analog", "Digital"] }, { name: "Women Watches", leaf: ["Smartwatches", "Luxury"] }] },
      { name: "Sports & Fitness", sub: [{ name: "Fitness", leaf: ["Gym Essentials", "Yoga"] }, { name: "Sports", leaf: ["Cricket", "Badminton"] }] },
      { name: "Car & Motorbike", sub: [{ name: "Car Accessories", leaf: ["Cleaning", "Interior"] }, { name: "Motorbike", leaf: ["Helmets", "Gloves"] }] },
      { name: "Office Supplies", sub: [{ name: "Stationery", leaf: ["Notebooks", "Pens"] }, { name: "Office", leaf: ["Files", "Calculators"] }] }
    ];

    let displayOrder = 1;
    for (const mainCat of categories) {
      const mainSlug = slugify(mainCat.name);
      const [main] = await queryInterface.sequelize.query(
        `INSERT INTO categories (public_id, name, slug, is_visible, display_order_web, created_at, updated_at) 
         VALUES ('${uuidv7()}', '${mainCat.name}', '${mainSlug}', true, ${displayOrder++}, NOW(), NOW()) RETURNING id`
      );
      const mainId = main[0].id;

      for (const subCat of mainCat.sub) {
        const subSlug = `${mainSlug}-${slugify(subCat.name)}`;
        const [sub] = await queryInterface.sequelize.query(
          `INSERT INTO categories (public_id, name, slug, parent_id, is_visible, created_at, updated_at) 
           VALUES ('${uuidv7()}', '${subCat.name}', '${subSlug}', ${mainId}, true, NOW(), NOW()) RETURNING id`
        );
        const subId = sub[0].id;
        for (const leaf of subCat.leaf) {
          await queryInterface.sequelize.query(
            `INSERT INTO categories (public_id, name, slug, parent_id, is_visible, created_at, updated_at) 
             VALUES ('${uuidv7()}', '${leaf}', '${subSlug}-${slugify(leaf)}', ${subId}, true, NOW(), NOW())`
          );
        }
      }
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
