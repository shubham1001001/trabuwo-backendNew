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
    console.log('--- COLUMN CHECK ---');
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories'
    `);
    console.log('Columns in categories table:');
    res.rows.forEach(r => console.log(' -', r.column_name));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
