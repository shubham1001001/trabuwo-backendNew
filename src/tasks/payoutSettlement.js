const { Order } = require("../modules/order/model");
const walletService = require("../modules/wallet/service");
const { Op } = require("sequelize");
const logger = require("../config/logger");

module.exports = async (payload, helpers) => {
  const now = new Date();

  logger.info(`Starting payout settlement check at ${now.toISOString()}`);

  const ordersToSettle = await Order.findAll({
    where: {
      status: "delivered",
      payoutDate: {
        [Op.lte]: now,
      },
    },
  });

  logger.info(`Found ${ordersToSettle.length} orders eligible for payout release`);

  for (const order of ordersToSettle) {
    try {
      await walletService.releaseFunds(order.id);
      
      // Update order to mark settlement processed if needed, 
      // but releaseFunds already handles wallet movement.
      // We could add a settled_at field to Order later.
      
      logger.info(`Successfully released funds for order ${order.publicId}`);
    } catch (error) {
      logger.error(`Failed to release funds for order ${order.publicId}:`, error);
    }
  }
};
