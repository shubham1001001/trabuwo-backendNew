"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn("products", "category_id");
  },

  async down(queryInterface, Sequelize) {
    // Re-add the column as nullable to avoid issues with existing rows
    // In practice, this migration should rarely be rolled back
    await queryInterface.addColumn("products", "category_id", {
      type: Sequelize.INTEGER,
      allowNull: true, // Keep nullable for safety
      references: {
        model: "categories",
        key: "id",
      },
    });

    // Populate category_id from catalogue for existing rows
    await queryInterface.sequelize.query(`
      UPDATE products 
      SET category_id = (
        SELECT category_id 
        FROM catalogues 
        WHERE catalogues.id = products.catalogue_id
      )
    `);
  },
};
