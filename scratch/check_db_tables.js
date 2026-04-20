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
    logging: false
  }
);

async function checkTables() {
  try {
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    const tables = results.map(t => t.table_name);
    console.log("Current Tables:", tables);
    
    const required = ['gold_section_settings', 'gold_categories'];
    required.forEach(table => {
      if (tables.includes(table)) {
        console.log(`✅ Table '${table}' exists.`);
      } else {
        console.log(`❌ Table '${table}' is MISSING.`);
      }
    });

  } catch (err) {
    console.error("Database connection error:", err.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();
