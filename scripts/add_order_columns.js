require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

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
        
        console.log('Adding home_order to home_categories...');
        await queryInterface.addColumn('home_categories', 'home_order', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        }).catch(err => console.log('Column home_order might already exist'));

        console.log('Adding gold_order to home_categories...');
        await queryInterface.addColumn('home_categories', 'gold_order', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        }).catch(err => console.log('Column gold_order might already exist'));

        // Optional: Sync existing display_order to home_order if applicable
        console.log('Syncing existing display_order to new columns...');
        await sequelize.query('UPDATE home_categories SET home_order = display_order, gold_order = display_order');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
