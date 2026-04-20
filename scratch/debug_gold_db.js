const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log // Enable logging to see the actual SQL
  }
);

async function debugSettings() {
  console.log(`Connecting to: ${process.env.DB_HOST} / ${process.env.DB_NAME}`);
  try {
    // 1. Try to find one row (this is what the backend does)
    console.log("\n--- Attempting to fetch Settings ---");
    const [settings] = await sequelize.query('SELECT * FROM gold_section_settings LIMIT 1');
    console.log("Settings Result:", settings);

    if (settings.length === 0) {
      console.log("⚠️ Table exists but is EMPTY. This is likely the cause of the crash.");
    }

    // 2. Try to fetch categories
    console.log("\n--- Attempting to fetch Gold Categories ---");
    const [categories] = await sequelize.query('SELECT * FROM gold_categories');
    console.log(`Found ${categories.length} categories.`);

  } catch (err) {
    console.error("\n❌ DATABASE ERROR:", err.message);
    if (err.original) {
        console.error("Detail:", err.original.detail);
    }
  } finally {
    await sequelize.close();
  }
}

debugSettings();
