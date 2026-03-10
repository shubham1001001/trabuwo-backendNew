"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    // full_name column add
    await queryInterface.addColumn("users", "full_name", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // copy data
    await queryInterface.sequelize.query(`
      UPDATE users
      SET full_name = COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')
    `);

    // remove old columns
    await queryInterface.removeColumn("users", "first_name");
    await queryInterface.removeColumn("users", "last_name");
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.addColumn("users", "first_name", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "last_name", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.removeColumn("users", "full_name");
  },
};