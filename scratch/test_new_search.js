require("dotenv").config();
const { Order, OrderItem } = require("../src/modules/order/model");
const { Return } = require("../src/modules/return/model");
const { Op } = require("sequelize");
const sequelize = require("../src/config/database");

async function getBuyerOrderStatusCounts(buyerId) {
  const allCount = await Order.count({ where: { buyerId } }).catch(() => 0);
  
  const orderedCount = await Order.count({
    where: {
      buyerId,
      status: { [Op.in]: ["pending", "ready_to_ship", "on_hold"] }
    }
  }).catch(() => 0);

  const shippedCount = await Order.count({
    where: {
      buyerId,
      status: "shipped"
    }
  }).catch(() => 0);

  const deliveredCount = await Order.count({
    where: {
      buyerId,
      status: "delivered"
    }
  }).catch(() => 0);

  const cancelledCount = await Order.count({
    where: {
      buyerId,
      status: "cancelled"
    }
  }).catch(() => 0);

  const returnCount = await Order.count({
    where: {
      buyerId,
      id: {
        [Op.in]: sequelize.literal(`(
          SELECT DISTINCT order_id FROM order_items oi
          INNER JOIN returns r ON r.order_item_id = oi.id
        )`)
      }
    }
  }).catch(() => 0);

  const exchangeCount = 0; 

  return [
    { key: "all", label: "All", count: allCount },
    { key: "ordered", label: "Ordered", count: orderedCount },
    { key: "shipped", label: "Shipped", count: shippedCount },
    { key: "delivered", label: "Delivered", count: deliveredCount },
    { key: "cancelled", label: "Cancelled", count: cancelledCount },
    { key: "exchange", label: "Exchange", count: exchangeCount },
    { key: "return", label: "Return", count: returnCount }
  ];
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database successfully.");

    const anyOrder = await Order.findOne({ raw: true });
    if (!anyOrder) {
      console.log("No orders found in DB. Test skipped.");
      process.exit(0);
    }
    const buyerId = anyOrder.buyerId;
    console.log(`Using buyerId: ${buyerId}`);

    const counts = await getBuyerOrderStatusCounts(buyerId);
    console.log("\n📊 Dynamic Filter Status counts:");
    console.log(JSON.stringify(counts, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR:", error);
    process.exit(1);
  }
}

run();
