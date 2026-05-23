require("dotenv").config();
try {
  console.log("🔍 Checking syntax and imports...");
  
  // Try requiring the modified files
  const dao = require("../src/modules/order/dao");
  console.log("✅ Order DAO required successfully. searchOrdersByBuyerId type:", typeof dao.searchOrdersByBuyerId);

  const service = require("../src/modules/order/service");
  console.log("✅ Order Service required successfully. searchOrdersByBuyerId type:", typeof service.searchOrdersByBuyerId);

  const controller = require("../src/modules/order/controller");
  console.log("✅ Order Controller required successfully. searchBuyerOrders type:", typeof controller.searchBuyerOrders);

  const validation = require("../src/modules/order/validation");
  console.log("✅ Order Validation required successfully. searchBuyerOrdersValidation exists:", !!validation.searchBuyerOrdersValidation);

  const routes = require("../src/modules/order/routes");
  console.log("✅ Order Routes required successfully.");

  console.log("\n🎉 ALL SYNTAX AND IMPORT CHECKS PASSED!");
  process.exit(0);
} catch (error) {
  console.error("❌ Syntax check failed with error:", error);
  process.exit(1);
}
