const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sql = "SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'display_order_web'";
    const res = await client.query(sql);
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
