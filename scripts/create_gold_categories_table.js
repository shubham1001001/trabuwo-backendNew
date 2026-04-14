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
        
        console.log('Creating gold_categories table...');
        await queryInterface.createTable('gold_categories', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            public_id: { type: DataTypes.UUID, allowNull: false, unique: true },
            name: { type: DataTypes.STRING, allowNull: false },
            redirect_category_id: { 
                type: DataTypes.INTEGER, 
                allowNull: true,
                references: { model: 'categories', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            img_url: { type: DataTypes.STRING(500), allowNull: true },
            display_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
            is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
            created_at: { type: DataTypes.DATE, allowNull: false },
            updated_at: { type: DataTypes.DATE, allowNull: false }
        });

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
