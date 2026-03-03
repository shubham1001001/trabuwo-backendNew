"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create razorpay_contacts table (normalized)
    await queryInterface.createTable("razorpay_contacts", {
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
      razorpay_contact_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: "Razorpay contact ID (e.g., cont_00000000000001)",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Phone number",
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
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

    await queryInterface.addIndex("razorpay_contacts", ["razorpay_contact_id"], {
      unique: true,
      name: "razorpay_contacts_razorpay_contact_id_unique",
    });

    await queryInterface.addIndex("razorpay_contacts", ["email"], {
      name: "razorpay_contacts_email_idx",
    });

    await queryInterface.addIndex("razorpay_contacts", ["contact"], {
      name: "razorpay_contacts_contact_idx",
    });

    // Create razorpay_fund_accounts table (normalized)
    await queryInterface.createTable("razorpay_fund_accounts", {
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
      razorpay_fund_account_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: "Razorpay fund account ID (e.g., fa_00000000000001)",
      },
      razorpay_contact_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "razorpay_contacts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      user_bank_info_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "user_bank_infos",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "Link to internal user bank info",
      },
      account_type: {
        type: Sequelize.ENUM("bank_account", "vpa"),
        allowNull: false,
      },
      bank_account_details: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Stores bank_account details: name, ifsc, account_number, bank_name",
      },
      vpa_details: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Stores VPA details: username, handle",
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex("razorpay_fund_accounts", ["razorpay_fund_account_id"], {
      unique: true,
      name: "razorpay_fund_accounts_razorpay_fund_account_id_unique",
    });

    await queryInterface.addIndex("razorpay_fund_accounts", ["razorpay_contact_id"], {
      name: "razorpay_fund_accounts_razorpay_contact_id_idx",
    });

    await queryInterface.addIndex("razorpay_fund_accounts", ["user_bank_info_id"], {
      name: "razorpay_fund_accounts_user_bank_info_id_idx",
    });

    await queryInterface.addIndex("razorpay_fund_accounts", ["account_type"], {
      name: "razorpay_fund_accounts_account_type_idx",
    });

    // Create bank_validations table (references razorpay_fund_accounts)
    await queryInterface.createTable("bank_validations", {
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
      razorpay_fund_account_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "razorpay_fund_accounts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        comment: "Reference to RazorpayFundAccount",
      },
      razorpay_validation_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: "Razorpay validation ID (e.g., fav_00000000000001)",
      },
      status: {
        type: Sequelize.ENUM("created", "completed", "failed"),
        allowNull: false,
        defaultValue: "created",
      },
      utr: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "12-digit UTR for successful validation",
      },
      account_status: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "active or invalid",
      },
      registered_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Name registered with bank",
      },
      name_match_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "Score between 0-100",
      },
      validation_details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status_details: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: "Status description, source, reason",
      },
      reference_id: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex("bank_validations", ["razorpay_fund_account_id"], {
      name: "bank_validations_razorpay_fund_account_id_idx",
    });

    await queryInterface.addIndex("bank_validations", ["razorpay_validation_id"], {
      unique: true,
      name: "bank_validations_razorpay_validation_id_unique",
    });

    await queryInterface.addIndex("bank_validations", ["status"], {
      name: "bank_validations_status_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bank_validations");
    await queryInterface.dropTable("razorpay_fund_accounts");
    await queryInterface.dropTable("razorpay_contacts");
  },
};
