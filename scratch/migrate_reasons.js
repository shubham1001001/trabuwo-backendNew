require("dotenv").config();
const sequelize = require("../src/config/database");

async function update() {
  try {
    // 1. Add type column
    await sequelize.query(`ALTER TABLE order_cancel_reasons ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'cancel'`);
    console.log("Column 'type' added or already exists.");

    // 2. Clear old data to avoid duplicates/confusion if needed, 
    // but better to just update or insert new ones.
    await sequelize.query(`DELETE FROM order_cancel_reasons`);
    console.log("Cleared old reasons.");

    // 3. Seed Cancellation Reasons (New Image)
    const cancelReasons = [
      { reason: "Wrong address selected", description: "Do you want to change your delivery address?", subreasons: ["Change address", "Cancel order"] },
      { reason: "Purchased product from somewhere else", description: "", subreasons: [] },
      { reason: "Product price has reduced", description: "", subreasons: [] },
      { reason: "Incorrect payment method selected", description: "", subreasons: [] },
      { reason: "Ordered by mistake", description: "", subreasons: [] },
      { reason: "Expected delivery time is too long", description: "", subreasons: [] },
      { reason: "Incorrect product size/color/type ordered", description: "", subreasons: [] },
      { reason: "Wrong contact number entered", description: "", subreasons: [] },
      { reason: "Product not required anymore", description: "", subreasons: [] },
      { reason: "Other", description: "", subreasons: [] }
    ];

    for (const r of cancelReasons) {
      await sequelize.query(
        `INSERT INTO order_cancel_reasons (reason, description, subreasons, type, created_at, updated_at) 
         VALUES (?, ?, ?, 'cancel', NOW(), NOW())`,
        { replacements: [r.reason, r.description, JSON.stringify(r.subreasons)] }
      );
    }
    console.log("Seeded Cancellation Reasons.");

    // 4. Seed Return Reasons (Old Image)
    const returnReasons = [
      { reason: "Product not needed anymore", description: "Didn't like the product or ordered by mistake", subreasons: ["Found lower price outside Trabuwo", "Did not like the product", "Purchased from somewhere else", "Changed my mind", "Other"] },
      { reason: "Quality issue", description: "Product quality is not up to the mark", subreasons: ["Poor product quality or performance", "Fabric/Material issue", "Product is not as described", "Other"] },
      { reason: "Size/Fit issue", description: "Product doesn't fit properly", subreasons: ["Too tight", "Too loose", "Length issue", "Size is different from size chart", "Other"] },
      { reason: "Received wrong product", description: "Received a different product from what was ordered", subreasons: ["Wrong color", "Wrong size", "Completely different product", "Missing parts/accessories", "Other"] },
      { reason: "Product missing in package", description: "One or more items are missing", subreasons: ["Main product is missing", "Accessories are missing", "Freebie is missing", "Other"] },
      { reason: "Other", description: "Any other reason", subreasons: [] }
    ];

    for (const r of returnReasons) {
      await sequelize.query(
        `INSERT INTO order_cancel_reasons (reason, description, subreasons, type, created_at, updated_at) 
         VALUES (?, ?, ?, 'return', NOW(), NOW())`,
        { replacements: [r.reason, r.description, JSON.stringify(r.subreasons)] }
      );
    }
    console.log("Seeded Return Reasons.");

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

update();
