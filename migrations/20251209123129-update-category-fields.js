"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn(
      "categories",
      "show_on_mobile",
      "show_on_web"
    );
    await queryInterface.renameColumn(
      "categories",
      "order",
      "display_order_web"
    );
    await queryInterface.removeColumn("categories", "image_url");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("categories", "image_url", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.renameColumn(
      "categories",
      "display_order_web",
      "order"
    );
    await queryInterface.renameColumn(
      "categories",
      "show_on_web",
      "show_on_mobile"
    );
  },
};
