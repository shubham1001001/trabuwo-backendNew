require("dotenv").config();
const { OrderCancelReason } = require("../src/modules/order/cancelReasonModel");
const sequelize = require("../src/config/database");

const reasons = [
  {
    reason: "Product not needed anymore",
    description: "Didn't like the product or ordered by mistake",
    subreasons: [
      "Found lower price outside Trabuwo",
      "Did not like the product",
      "Delivery was late",
      "Ordered by mistake",
      "Changed my mind"
    ],
    userType: "buyer"
  },
  {
    reason: "Quality issue",
    description: "Poor fabric material, finishing or performance",
    subreasons: ["Poor product quality or performance"],
    userType: "buyer"
  },
  {
    reason: "Size/Fit issue",
    description: "Tight or loose fitting",
    subreasons: [
      "Size correct but too tight",
      "Size correct but too loose",
      "Did not like the fit"
    ],
    userType: "buyer"
  },
  {
    reason: "Damaged/Used product",
    description: "Dirty, old, torn, or broken products",
    subreasons: [
      "Dirty/Old/Used product",
      "Broken/Torn product",
      "Both packaging and product damaged"
    ],
    userType: "buyer"
  },
  {
    reason: "Item Missing in the package",
    description: "Part missing in product or got less quantity",
    subreasons: ["Did not receive the product", "Received incomplete product"],
    userType: "buyer"
  },
  {
    reason: "Different product delivered",
    description: "Received different size/color/product than ordered",
    subreasons: [
      "Same product but different size",
      "Same product but different colour",
      "Completely different product"
    ],
    userType: "buyer"
  }
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB");
    
    // Sync model
    await OrderCancelReason.sync({ alter: true });
    console.log("Synced OrderCancelReason table");

    // Deactivate old buyer reasons
    await OrderCancelReason.update({ isActive: false }, { where: { userType: "buyer" } });

    // Insert new reasons
    for (const r of reasons) {
      await OrderCancelReason.create(r);
    }
    
    console.log("Seeding completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
