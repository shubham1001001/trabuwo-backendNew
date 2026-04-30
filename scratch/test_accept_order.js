require('dotenv').config();
const orderService = require('../src/modules/order/service');
const logger = require('../src/config/logger');

async function testAcceptOrder() {
    const orderPublicId = '019dbe37-dd45-7598-8d7d-a4f9f7b9d618';
    const sellerId = 1;
    
    try {
        console.log(`Testing acceptOrder for Order ${orderPublicId} with Seller ${sellerId}...`);
        const result = await orderService.acceptOrder(orderPublicId, sellerId);
        console.log('Order accepted successfully!');
        console.log('Shiprocket Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error accepting order:', error);
        if (error.data) {
            console.error('Error data:', JSON.stringify(error.data, null, 2));
        }
    } finally {
        process.exit();
    }
}

testAcceptOrder();
