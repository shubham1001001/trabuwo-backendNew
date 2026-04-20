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

async function checkTable() {
  const table = 'original_brand_categories';
  try {
    const [results] = await sequelize.query(`SELECT table_name FROM information_schema.tables WHERE table_name = '${table}'`);
    if (results.length > 0) {
        console.log(`✅ Table '${table}' exists.`);
        const [cols] = await sequelize.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
        console.log("Columns:");
        cols.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));
    } else {
        console.log(`❌ Table '${table}' is MISSING.`);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sequelize.close();
  }
}
checkTable();
