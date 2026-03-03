"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("section_assets", {
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
      section_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "category_sections", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      redirect_category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      icon_small_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      icon_medium_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      icon_large_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      original_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      alt_text: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      device_type: {
        type: Sequelize.ENUM("mobile", "web", "both"),
        allowNull: false,
        defaultValue: "both",
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex("section_assets", ["section_id"], {
      name: "idx_section_assets_section_id",
    });

    await queryInterface.addIndex(
      "section_assets",
      ["redirect_category_id"],
      { name: "idx_section_assets_redirect_category_id" }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("section_assets");
  },
};


