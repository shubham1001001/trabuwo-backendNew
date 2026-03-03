"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("returns", {
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
      order_item_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "order_items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM(
          "initiated",
          "in_transit",
          "received",
          "refunded",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "initiated",
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      shiprocket_return_order_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      return_awb_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      return_tracking_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      razorpay_refund_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      refunded_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
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

    await queryInterface.addIndex("returns", ["order_item_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("returns");
  },
};
