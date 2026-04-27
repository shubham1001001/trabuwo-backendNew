const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    user: process.env.DB_USER, 
    host: process.env.DB_HOST, 
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, 
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- DB SCHEMA UPDATE FOR CART (RESELLER SUPPORT) ---');
    
    // 1. Update carts table
    console.log('Altering carts table...');
    await client.query(`
      ALTER TABLE carts 
      ADD COLUMN IF NOT EXISTS reseller_id BIGINT REFERENCES users(id)
    `);
    console.log('Carts table updated.');

    // 2. Update cart_items table
    console.log('Altering cart_items table...');
    await client.query(`
      ALTER TABLE cart_items 
      ADD COLUMN IF NOT EXISTS reseller_price DECIMAL(10, 2)
    `);
    console.log('Cart Items table updated.');

    console.log('✅ CART SCHEMA UPDATES COMPLETED.');

  } catch (err) {
    console.error('❌ Error during cart schema update:', err);
  } finally {
    await client.end();
  }
}

run();
