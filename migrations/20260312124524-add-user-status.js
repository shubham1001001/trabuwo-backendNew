'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "status", {
      type: Sequelize.ENUM("active", "deleted"),
      allowNull: false,
      defaultValue: "active",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "status");
  },
};