const { v7: uuidv7 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("mobile_category_sections", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      public_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        defaultValue: uuidv7(),
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      is_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      tiles: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("mobile_category_sections", ["category_id"], {
      name: "idx_mobile_cat_sections_cat_id_unique",
    });
    await queryInterface.addIndex("mobile_category_sections", ["public_id"], {
      name: "idx_mobile_cat_sections_pub_id_unique",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("mobile_category_sections");
  },
};
