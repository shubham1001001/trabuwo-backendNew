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

async function checkColumns() {
  const tables = ['gold_section_settings', 'gold_categories'];
  for (const table of tables) {
    try {
      const [results] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
        ORDER BY ordinal_position
      `);
      console.log(`\nColumns for ${table}:`);
      results.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
    } catch (e) {
      console.error(`Error checking ${table}:`, e.message);
    }
  }
  await sequelize.close();
}
checkColumns();
