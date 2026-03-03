"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("section_assets", "icon_small_url");
    await queryInterface.removeColumn("section_assets", "icon_medium_url");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("section_assets", "icon_small_url", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn("section_assets", "icon_medium_url", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },
};

