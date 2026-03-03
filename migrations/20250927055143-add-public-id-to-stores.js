"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stores", "public_id", {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("stores", "public_id");
  },
};
