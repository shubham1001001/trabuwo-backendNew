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
    console.log(`Successfully connected as ${user} to ${database}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed to connect as ${user} to ${database}: ${err.message}`);
    return false;
  }
}

async function run() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;

  const users = [
    { u: process.env.DB_USER, p: process.env.DB_PASSWORD },
    { u: 'postgres', p: 'Inurum@2612' }
  ];
  
  const dbs = [
    process.env.DB_NAME,
    'trabuwo_db',
    'trabuwo_dev',
    'trabuwo_new_db',
    'postgres'
  ];

  for (const user of users) {
    for (const db of dbs) {
       await testConnection(user.u, user.p, host, port, db);
    }
  }
}

run();
