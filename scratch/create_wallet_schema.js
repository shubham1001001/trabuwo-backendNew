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
    console.log('--- DB SCHEMA UPDATE FOR WALLET MODULE ---');
    
    // 1. Create wallets table
    console.log('Creating wallets table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id BIGSERIAL PRIMARY KEY,
        public_id UUID NOT NULL UNIQUE,
        user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        pending_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        available_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        locked_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Wallets table created.');

    // 2. Create wallet_transactions table
    console.log('Creating wallet_transactions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id BIGSERIAL PRIMARY KEY,
        public_id UUID NOT NULL UNIQUE,
        wallet_id BIGINT NOT NULL REFERENCES wallets(id),
        order_id BIGINT REFERENCES orders(id),
        amount DECIMAL(15, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        reason VARCHAR(100) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Wallet transactions table created.');

    console.log('✅ WALLET SCHEMA UPDATES COMPLETED.');

  } catch (err) {
    console.error('❌ Error during wallet schema update:', err);
  } finally {
    await client.end();
  }
}

run();
