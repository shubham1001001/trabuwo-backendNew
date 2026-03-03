"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("gst_verifications", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      public_id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      seller_onboarding_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "seller_onboardings",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      id_type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      id_value: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      gstin: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      legal_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      trade_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      registration_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      taxpayer_type: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      einvoice_status: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
      principal_address_adr: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      principal_address_loc: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      principal_address_pincode: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
      principal_address_state: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      principal_address_district: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      principal_address_street: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      principal_address_city: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      raw_data: {
        type: Sequelize.JSONB,
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

    await queryInterface.addConstraint("gst_verifications", {
      fields: ["seller_onboarding_id", "id_type"],
      type: "unique",
      name: "gst_verifications_seller_onboarding_id_id_type_unique",
    });

    await queryInterface.sequelize.query(
      "ALTER TABLE gst_verifications ADD CONSTRAINT gst_verifications_id_type_check CHECK (id_type IN ('GSTIN', 'EID'))"
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("gst_verifications");
  },
};
