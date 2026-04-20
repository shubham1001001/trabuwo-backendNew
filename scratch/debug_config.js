const config = require("config");
require("dotenv").config();

console.log("--- CONFIG DEBUG ---");
console.log("DO_SPACE_NAME from process.env:", process.env.DO_SPACE_NAME);
try {
  console.log("digitalocean.spaceName from config:", config.get("digitalocean.spaceName"));
  console.log("digitalocean.region from config:", config.get("digitalocean.region"));
  console.log("digitalocean.endpoint from config:", config.get("digitalocean.endpoint"));
} catch (err) {
  console.error("Config error:", err.message);
}
