require("dotenv").config();
const { searchOrdersByBuyerId } = require("../src/modules/order/dao");
const sequelize = require("../src/config/database");

async function debug() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB");

    // Let's run with search query 'kurti' and status 'cancelled'
    const result = await searchOrdersByBuyerId(43, { query: "kurti", status: "cancelled", page: 1, limit: 5 });
    console.log("Success! Results count:", result.count);
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR RECEIVED:");
    console.error("Message:", error.message);
    if (error.parent) {
      console.error("Parent Message:", error.parent.message);
      console.error("Parent SQL:", error.parent.sql);
    }
    process.exit(1);
  }
}

debug();
