"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("category_icons", {
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
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      filter: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      icon_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      original_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      alt_text: {
        type: Sequelize.STRING(255),
        allowNull: true,
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

    await queryInterface.addIndex("category_icons", ["category_id"], {
      name: "idx_category_icons_category_id",
    });

    await queryInterface.addIndex(
      "category_icons",
      ["category_id", "enabled", "is_deleted"],
      { name: "idx_category_icons_category_enabled_not_deleted" }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("category_icons");
  },
};
