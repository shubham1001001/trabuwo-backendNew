"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("refunds", {
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
      payment_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "payments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "NO ACTION",
      },
      gateway_refund_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      gateway_payment_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: "Amount in smallest currency unit (paise for INR)",
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "INR",
      },
      status: {
        type: Sequelize.ENUM("pending", "processed", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      speed_requested: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      speed_processed: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      receipt: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      acquirer_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      batch_id: {
        type: Sequelize.STRING,
        allowNull: true,
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

    await queryInterface.addIndex("refunds", ["payment_id"]);
    await queryInterface.addIndex("refunds", ["gateway_payment_id"]);
    await queryInterface.addIndex("refunds", ["gateway_refund_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("refunds");
  },
};
