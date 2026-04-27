const { Order } = require("../modules/order/model");
const walletService = require("../modules/wallet/service");
const { Op } = require("sequelize");
const logger = require("../config/logger");

exports.getJobConfig = () => ({
  cron: "0 2 * * *", // Runs every day at 2:00 AM
  retries: 3,
});

exports.task = async (payload, helpers) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  logger.info(`Starting payout settlement for orders delivered before ${sevenDaysAgo.toISOString()}`);

  const ordersToSettle = await Order.findAll({
    where: {
      status: "delivered",
      deliveryDate: {
        [Op.lte]: sevenDaysAgo,
      },
    },
  });

  logger.info(`Found ${ordersToSettle.length} orders to settle`);

  for (const order of ordersToSettle) {
    try {
      await walletService.releaseFunds(order.id);
      logger.info(`Successfully settled payout for order ${order.id}`);
    } catch (error) {
      logger.error(`Failed to settle payout for order ${order.id}:`, error);
    }
  }
};
