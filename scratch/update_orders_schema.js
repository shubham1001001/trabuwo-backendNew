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
    console.log('--- DB SCHEMA UPDATE FOR REVENUE & RESELLER MODEL ---');
    
    // 1. Update roles enum if it's a custom type
    console.log('Updating Role ENUM...');
    try {
        await client.query("ALTER TYPE \"enum_roles_name\" ADD VALUE IF NOT EXISTS 'reseller'");
        await client.query("ALTER TYPE \"enum_roles_name\" ADD VALUE IF NOT EXISTS 'influencer'");
        console.log('Role ENUM updated.');
    } catch (e) {
        console.log('Note: enum_roles_name update skipped or already exists.');
    }

    // 2. Update orders table
    console.log('Altering orders table...');
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS reseller_id BIGINT REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255) DEFAULT 'prepaid',
      ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cod_fee DECIMAL(10, 2) DEFAULT 0
    `);
    console.log('Orders table updated.');

    // 3. Update order_items table
    console.log('Altering order_items table...');
    await client.query(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS listing_price DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS reseller_price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS reseller_margin DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS seller_payout DECIMAL(10, 2) DEFAULT 0
    `);
    console.log('Order Items table updated.');

    console.log('✅ ALL UPDATES COMPLETED SUCCESSFULLY.');

  } catch (err) {
    console.error('❌ Error during schema update:', err);
  } finally {
    await client.end();
  }
}

run();
