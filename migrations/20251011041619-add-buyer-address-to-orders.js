"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "buyer_address_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "user_addresses",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "buyer_address_id");
  },
};
