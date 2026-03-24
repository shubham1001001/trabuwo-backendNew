"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("brands", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      public_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      slug: {
        type: Sequelize.STRING,
        unique: true,
      },

      logo_url: {
        type: Sequelize.TEXT,
      },

      banner_url: {
        type: Sequelize.TEXT,
      },

      description: {
        type: Sequelize.TEXT,
      },

      website_url: {
        type: Sequelize.TEXT,
      },

      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },

      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      created_by: {
        type: Sequelize.BIGINT,
      },

      updated_by: {
        type: Sequelize.BIGINT,
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Index for search
    await queryInterface.addIndex("brands", ["name"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("brands");
  },
};