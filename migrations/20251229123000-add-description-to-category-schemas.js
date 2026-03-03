"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("category_schemas", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE category_schemas
      ADD CONSTRAINT category_schemas_description_length_check
      CHECK (description IS NULL OR char_length(description) <= 1000)
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("category_schemas", "description");
  },
};
