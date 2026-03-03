
require("dotenv").config();
const { execSync } = require("child_process");

try {
  console.log("Running database migration...");
  execSync("npx sequelize-cli db:migrate", { stdio: "inherit" });
  console.log("Migration completed successfully!");
} catch (error) {
  console.error("Migration failed:", error.message);
  // eslint-disable-next-line no-undef
  process.exit(1);
}
