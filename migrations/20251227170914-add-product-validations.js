"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_name_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_manufacturer_pincode_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_packer_pincode_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_importer_pincode_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_weight_in_gram_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_dynamic_fields_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_style_code_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_description_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_trabuwo_price_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_wrong_defective_return_price_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_mrp_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_inventory_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_sku_id_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_dynamic_fields_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_name_length_check 
      CHECK (char_length(name) >= 1 AND char_length(name) <= 255);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_manufacturer_pincode_check 
      CHECK (manufacturer_pincode ~ '^[0-9]{6}$');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_packer_pincode_check 
      CHECK (packer_pincode ~ '^[0-9]{6}$');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_importer_pincode_check 
      CHECK (importer_pincode ~ '^[0-9]{6}$');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_weight_in_gram_check 
      CHECK (weight_in_gram > 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_dynamic_fields_check 
      CHECK (jsonb_typeof(dynamic_fields) = 'object');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_style_code_length_check 
      CHECK (style_code IS NULL OR (char_length(style_code) >= 0 AND char_length(style_code) <= 255));
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_description_length_check 
      CHECK (description IS NULL OR char_length(description) <= 1000);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT product_variants_trabuwo_price_check 
      CHECK (trabuwo_price >= 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT product_variants_wrong_defective_return_price_check 
      CHECK (wrong_defective_return_price >= 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT product_variants_mrp_check 
      CHECK (mrp >= 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT product_variants_inventory_check 
      CHECK (inventory >= 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT product_variants_sku_id_length_check 
      CHECK (sku_id IS NULL OR (char_length(sku_id) >= 0 AND char_length(sku_id) <= 100));
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT product_variants_dynamic_fields_check 
      CHECK (jsonb_typeof(dynamic_fields) = 'object');
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_name_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_manufacturer_pincode_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_packer_pincode_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_importer_pincode_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_weight_in_gram_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_dynamic_fields_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_style_code_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_description_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_trabuwo_price_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_wrong_defective_return_price_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_mrp_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_inventory_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_sku_id_length_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE product_variants
      DROP CONSTRAINT IF EXISTS product_variants_dynamic_fields_check;
    `);
  },
};
