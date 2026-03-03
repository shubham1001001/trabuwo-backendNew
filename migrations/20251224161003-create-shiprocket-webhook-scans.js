"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("shiprocket_webhook_scans", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      shipment_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "shipments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      activity: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
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

    await queryInterface.addIndex(
      "shiprocket_webhook_scans",
      ["shipment_id", "date", "activity"],
      {
        unique: true,
        name: "shiprocket_webhook_scans_unique",
      }
    );

    await queryInterface.addIndex("shiprocket_webhook_scans", ["shipment_id"], {
      name: "shiprocket_webhook_scans_shipment_id_idx",
    });

    await queryInterface.addIndex("shiprocket_webhook_scans", ["date"], {
      name: "shiprocket_webhook_scans_date_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("shiprocket_webhook_scans");
  },
};
