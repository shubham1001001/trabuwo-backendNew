require('dotenv').config();
const sequelize = require('../src/config/database');

async function checkColumns() {
    try {
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'order_items'
        `);
        console.log('Columns in order_items table:');
        results.forEach(row => console.log(row.column_name));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkColumns();
