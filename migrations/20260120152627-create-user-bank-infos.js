"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_bank_infos", {
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
      encrypted_bank_account_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      encrypted_bank_ifsc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      encrypted_bank_account_holder_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      encrypted_upi_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      encrypted_upi_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bank_account_number_index: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bank_ifsc_index: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      upi_id_index: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      key_version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
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

    await queryInterface.addIndex("user_bank_infos", ["user_id"], {
      unique: true,
      name: "user_bank_infos_user_id_unique",
    });

    await queryInterface.addIndex("user_bank_infos", ["public_id"], {
      unique: true,
      name: "user_bank_infos_public_id_unique",
    });

    await queryInterface.addIndex("user_bank_infos", ["bank_account_number_index"], {
      name: "user_bank_infos_bank_account_number_index_idx",
    });

    await queryInterface.addIndex("user_bank_infos", ["bank_ifsc_index"], {
      name: "user_bank_infos_bank_ifsc_index_idx",
    });

    await queryInterface.addIndex("user_bank_infos", ["upi_id_index"], {
      name: "user_bank_infos_upi_id_index_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_bank_infos");
  },
};
