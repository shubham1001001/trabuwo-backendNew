'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Drop `is_gold` from `home_categories`
    try {
      await queryInterface.removeColumn('home_categories', 'is_gold');
      console.log('Removed is_gold from home_categories');
    } catch (err) {
      console.log('is_gold was already removed or does not exist on home_categories');
    }

    // 2. Create `gold_categories` table
    await queryInterface.createTable('gold_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      public_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      redirect_category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      img_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    console.log('Created gold_categories table successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add `is_gold` to `home_categories`
    await queryInterface.addColumn('home_categories', 'is_gold', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    // Drop `gold_categories`
    await queryInterface.dropTable('gold_categories');
  }
};
