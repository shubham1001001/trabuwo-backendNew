require('dotenv').config();
const sequelize = require('../src/config/database');

async function findSeller() {
    try {
        const [results] = await sequelize.query(`
            SELECT c.user_id 
            FROM order_items oi
            JOIN product_variants pv ON oi.product_variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            JOIN catalogues c ON p.catalogue_id = c.id
            WHERE oi.order_id = 4
            LIMIT 1
        `);
        if (results.length > 0) {
            console.log('Seller User ID for Order 4:', results[0].user_id);
        } else {
            console.log('No seller found for Order 4');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

findSeller();
