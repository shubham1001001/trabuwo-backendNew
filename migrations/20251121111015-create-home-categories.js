"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("home_categories", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "home_categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      section_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "category_sections", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      redirect_category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      img_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      device_type: {
        type: Sequelize.ENUM("mobile", "web", "both"),
        allowNull: false,
        defaultValue: "both",
      },
      filters: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("home_categories", ["section_id"], {
      name: "idx_home_categories_section_id",
    });

    await queryInterface.addIndex(
      "home_categories",
      ["redirect_category_id"],
      {
        name: "idx_home_categories_redirect_category_id",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("home_categories");
  },
};

