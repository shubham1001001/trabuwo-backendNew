"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("policy_types", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
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

    await queryInterface.bulkInsert("policy_types", [
      {
        code: "terms_of_service",
        display_name: "Terms of Service",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        code: "privacy_policy",
        display_name: "Privacy Policy",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        code: "cookies_policy",
        display_name: "Cookies Policy",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.createTable("policies", {
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
      slug: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      policy_type_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "policy_types",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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

    await queryInterface.createTable("policy_versions", {
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
      policy_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "policies",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      content_markdown: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      version_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      "policy_versions",
      ["policy_id", "version_number"],
      {
        name: "policy_versions_policy_id_version_number_idx",
      },
    );

    await queryInterface.addIndex(
      "policy_versions",
      ["policy_id", "is_active"],
      {
        name: "policy_versions_policy_id_is_active_idx",
      },
    );

    await queryInterface.createTable("user_agreements", {
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
      version_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "policy_versions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      agreed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      ip_address: {
        type: Sequelize.STRING(64),
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
      "user_agreements",
      ["user_id", "version_id"],
      {
        name: "user_agreements_user_id_version_id_idx",
        unique: true,
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_agreements");
    await queryInterface.dropTable("policy_versions");
    await queryInterface.dropTable("policies");
    await queryInterface.dropTable("policy_types");
  },
};
