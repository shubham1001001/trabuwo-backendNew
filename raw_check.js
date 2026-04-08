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
    console.log('--- DB UPDATE (UNDERSCORED) ---');
    
    // Check specific IDs first
    const res = await client.query('SELECT id, name, parent_id, display_order_web FROM categories WHERE id IN (6553, 6552, 6468)');
    console.table(res.rows);

    // Update
    const updateRes = await client.query('UPDATE categories SET display_order_web = NULL WHERE parent_id IS NOT NULL');
    console.log('Update result:', updateRes.rowCount, 'rows updated.');

    // Verify
    const verifyRes = await client.query('SELECT id, name, parent_id, display_order_web FROM categories WHERE id IN (6553, 6552)');
    console.table(verifyRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
