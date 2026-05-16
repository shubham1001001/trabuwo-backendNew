require("dotenv").config();
const sequelize = require("../src/config/database");

async function update() {
  try {
    const orderId = "019e301f-683b-77ad-9763-cf2b924ed480";
    const paymentId = "019e301f-6960-73c1-bfa7-56be235a03a7";

    await sequelize.query(`UPDATE orders SET status = 'pending' WHERE public_id = '${orderId}'`);
    console.log("Order status updated to pending");

    await sequelize.query(`UPDATE payments SET status = 'captured' WHERE public_id = '${paymentId}'`);
    console.log("Payment status updated to captured");

    process.exit(0);
  } catch (err) {
    console.error("Update failed:", err);
    process.exit(1);
  }
}

update();
