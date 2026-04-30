require('dotenv').config();
const sequelize = require('../src/config/database');

async function fixOrderTable() {
    try {
        console.log('Adding missing columns to orders table...');
        await sequelize.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS payout_date TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS logistics_cost DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS pg_cost DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS shipping_margin DECIMAL(10, 2) DEFAULT 0
        `);
        console.log('Successfully added missing columns to orders table.');
    } catch (error) {
        console.error('Error fixing orders table:', error);
    } finally {
        process.exit();
    }
}

fixOrderTable();
