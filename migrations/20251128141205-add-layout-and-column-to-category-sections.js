"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("category_sections", "layout", {
      type: Sequelize.ENUM("horizontal", "grid"),
      allowNull: false,
      defaultValue: "grid",
    });

    await queryInterface.addColumn("category_sections", "column", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 3,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("category_sections", "layout");
    await queryInterface.removeColumn("category_sections", "column");
  },
};
