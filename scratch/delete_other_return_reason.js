require("dotenv").config();
const { OrderCancelReason } = require("../src/modules/order/cancelReasonModel");
const sequelize = require("../src/config/database");

async function run() {
  try {
    await sequelize.authenticate();
    console.log("✅ Successfully connected to the database.");

    // 1. Fetch reasons before delete to verify
    const beforeReasons = await OrderCancelReason.findAll({
      where: { type: "return" },
      raw: true
    });
    console.log("🔍 Return reasons in DB before operation:");
    console.log(JSON.stringify(beforeReasons, null, 2));

    // 2. Perform delete for reason = 'Other' and type = 'return'
    const deletedCount = await OrderCancelReason.destroy({
      where: {
        reason: "Other",
        type: "return"
      }
    });

    console.log(`\n🗑️ Deleted ${deletedCount} record(s) where reason = 'Other' and type = 'return'.`);

    // 3. Fetch reasons after delete to verify
    const afterReasons = await OrderCancelReason.findAll({
      where: { type: "return" },
      raw: true
    });
    console.log("\n🔍 Return reasons in DB after operation:");
    console.log(JSON.stringify(afterReasons, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("❌ Operation failed:", error);
    process.exit(1);
  }
}

run();
