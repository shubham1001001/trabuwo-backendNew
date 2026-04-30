require('dotenv').config();
const { Order, OrderItem } = require('../src/modules/order/model');
const { ProductVariant, Product } = require('../src/modules/product/model');
const { Catalogue } = require('../src/modules/catalogue/model');

async function findSellerForOrder(orderId) {
    try {
        const orderItem = await OrderItem.findOne({
            where: { orderId: orderId },
            include: [
                {
                    model: ProductVariant,
                    as: 'productVariant',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            include: [
                                {
                                    model: Catalogue,
                                    as: 'catalogue'
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        
        if (orderItem && orderItem.productVariant && orderItem.productVariant.product && orderItem.productVariant.product.catalogue) {
            console.log('Order ID: ' + orderId);
            console.log('Seller User ID: ' + orderItem.productVariant.product.catalogue.userId);
            return orderItem.productVariant.product.catalogue.userId;
        } else {
            console.log('Could not find seller for order ' + orderId);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

findSellerForOrder(4); // Testing with Order ID 4
