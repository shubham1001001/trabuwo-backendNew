require('dotenv').config();
const { Order } = require('../src/modules/order/model');
const { User } = require('../src/modules/auth/model');
const { ProductVariant } = require('../src/modules/product/model');

async function checkPendingOrders() {
    try {
        const orders = await Order.findAll({
            where: { status: 'pending' },
            limit: 5,
            include: [
                { model: User, as: 'buyer' }
            ]
        });
        
        console.log('Found ' + orders.length + ' pending orders:');
        orders.forEach(order => {
            console.log(`Order ID: ${order.id}, Public ID: ${order.publicId}, Total: ${order.totalAmount}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkPendingOrders();
