require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../src/config/database');

// Build connection manually based on config or .env for safety
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const queryInterface = sequelize.getQueryInterface();
        
        console.log('Adding background_image_url to gold_section_settings...');
        await queryInterface.addColumn('gold_section_settings', 'background_image_url', {
            type: DataTypes.STRING(500),
            allowNull: true
        }).catch(err => console.log('Column background_image_url might already exist'));

        console.log('Adding shop_now_category_id to gold_section_settings...');
        await queryInterface.addColumn('gold_section_settings', 'shop_now_category_id', {
            type: DataTypes.INTEGER,
            allowNull: true
        }).catch(err => console.log('Column shop_now_category_id might already exist'));

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
