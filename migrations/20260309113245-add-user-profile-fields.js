'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('users', 'first_name', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'last_name', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'dob', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'marital_status', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'number_of_kids', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'occupation', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'education', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'monthly_income', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'about_me', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'language_spoken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'profile_image', {
      type: Sequelize.TEXT,
      allowNull: true
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('users', 'first_name');
    await queryInterface.removeColumn('users', 'last_name');
    await queryInterface.removeColumn('users', 'gender');
    await queryInterface.removeColumn('users', 'dob');
    await queryInterface.removeColumn('users', 'marital_status');
    await queryInterface.removeColumn('users', 'number_of_kids');
    await queryInterface.removeColumn('users', 'occupation');
    await queryInterface.removeColumn('users', 'education');
    await queryInterface.removeColumn('users', 'monthly_income');
    await queryInterface.removeColumn('users', 'about_me');
    await queryInterface.removeColumn('users', 'language_spoken');
    await queryInterface.removeColumn('users', 'profile_image');

  }
};