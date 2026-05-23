require("dotenv").config();
const sequelize = require("../src/config/database");

async function check() {
  try {
    await sequelize.authenticate();
    const result = await sequelize.query(
      `SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'enum_orders_status';`
    );
    console.log("Database enum values for enum_orders_status:", result[0]);
    process.exit(0);
  } catch (error) {
    console.error("Failed to query pg_enum:", error);
    process.exit(1);
  }
}

check();
