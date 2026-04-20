const { Client } = require('pg');
require('dotenv').config();

async function testConnection(user, password, host, port, database) {
  const client = new Client({
    user,
    host,
    database,
    password,
    port,
  });

  try {
    await client.connect();
    console.log(`Successfully connected as ${user}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed to connect as ${user}: ${err.message}`);
    return false;
  }
}

async function run() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const dbName = process.env.DB_NAME || 'trabuwo_db';

  console.log('Testing with current .env credentials:');
  await testConnection(process.env.DB_USER, process.env.DB_PASSWORD, host, port, dbName);

  console.log('\nTesting with postgres fallback:');
  await testConnection('postgres', 'Inurum@2612', host, port, dbName);
}

run();
