"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_stock_notifications", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      public_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      product_variant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "product_variants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      is_notified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("product_stock_notifications", ["user_id"], {
      name: "product_stock_notifications_user_id_idx",
    });

    await queryInterface.addIndex("product_stock_notifications", ["product_variant_id"], {
      name: "product_stock_notifications_product_variant_id_idx",
    });

    await queryInterface.addIndex("product_stock_notifications", ["is_active"], {
      name: "product_stock_notifications_is_active_idx",
    });

    await queryInterface.addIndex("product_stock_notifications", ["is_notified"], {
      name: "product_stock_notifications_is_notified_idx",
    });

    await queryInterface.addIndex(
      "product_stock_notifications",
      ["user_id", "product_variant_id"],
      {
        unique: true,
        name: "product_stock_notifications_user_variant_unique",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("product_stock_notifications");
  },
};
