"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("section_assets", "filters", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("section_assets", "filters");
  },
};
