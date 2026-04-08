require('dotenv').config();
const { Sequelize } = require('sequelize');

async function run() {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'trabuwo_dev',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      port: process.env.DB_PORT || 5432,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: console.log
    }
  );

  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully.');

    const [results, metadata] = await sequelize.query(
      'UPDATE categories SET "displayOrderWeb" = NULL WHERE "parentId" IS NOT NULL'
    );

    console.log('Update successful.');
    console.log('Rows affected:', metadata.rowCount);
  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    await sequelize.close();
  }
}

run();
