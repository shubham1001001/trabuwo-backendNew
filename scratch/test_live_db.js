const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    user: 'myuser',
    host: '168.144.66.253',
    database: 'trabuwo_db',
    password: 'trabuwopassword',
    port: 5432,
    // Live databases usually require SSL
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect to DigitalOcean database at 168.144.66.253...');
    await client.connect();
    console.log('Successfully connected to the LIVE database!');
    await client.end();
  } catch (err) {
    console.error('Failed to connect to the LIVE database:', err.message);
  }
}

testConnection();
