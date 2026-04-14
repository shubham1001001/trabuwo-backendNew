require('dotenv').config();
const sequelize = require('./src/config/database');
const { DataTypes } = require('sequelize');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const queryInterface = sequelize.getQueryInterface();

    // 1. Add is_gold to home_categories
    console.log('Adding is_gold to home_categories...');
    await queryInterface.addColumn('home_categories', 'is_gold', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }).catch(err => console.log('is_gold column might already exist or error:', err.message));

    // 2. Create GoldSectionSettings table
    console.log('Creating gold_section_settings table...');
    await queryInterface.createTable('gold_section_settings', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Gold'
      },
      subtitle: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Products you choose, quality we promise.'
      },
      hero_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }).catch(err => console.log('gold_section_settings table might already exist or error:', err.message));

    // 3. Seed initial Gold Settings if empty
    const [results] = await sequelize.query('SELECT count(*) FROM gold_section_settings');
    if (results[0].count == 0) {
      console.log('Seeding initial gold settings...');
      await sequelize.query(`
        INSERT INTO gold_section_settings (title, subtitle, is_active, created_at, updated_at)
        VALUES ('Gold', 'Products you choose, quality we promise.', true, NOW(), NOW())
      `);
    }

    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
