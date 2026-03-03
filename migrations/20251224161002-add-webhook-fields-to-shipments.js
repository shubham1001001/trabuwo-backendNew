"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("shipments", "current_status", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("shipments", "current_status_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("shipments", "shipment_status", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("shipments", "shipment_status_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("shipments", "current_timestamp", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("shipments", "etd", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("shipments", "channel_order_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("shipments", "channel", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Note: Unique constraints on awb_number and shiprocket_order_id should already exist
    // from the original shipments table creation. If they don't exist, they should be
    // added separately as partial unique indexes (PostgreSQL supports WHERE clause in unique indexes)

    // Add index on current_timestamp for conditional update performance
    await queryInterface.addIndex("shipments", ["current_timestamp"], {
      name: "shipments_current_timestamp_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("shipments", "shipments_current_timestamp_idx");
    await queryInterface.removeColumn("shipments", "channel");
    await queryInterface.removeColumn("shipments", "channel_order_id");
    await queryInterface.removeColumn("shipments", "etd");
    await queryInterface.removeColumn("shipments", "current_timestamp");
    await queryInterface.removeColumn("shipments", "shipment_status_id");
    await queryInterface.removeColumn("shipments", "shipment_status");
    await queryInterface.removeColumn("shipments", "current_status_id");
    await queryInterface.removeColumn("shipments", "current_status");
  },
};

