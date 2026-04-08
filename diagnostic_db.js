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
      logging: false
    }
  );

  try {
    await sequelize.authenticate();
    console.log('--- DATABASE DIAGNOSTIC ---');
    
    // Check total categories
    const [total] = await sequelize.query('SELECT COUNT(*) as count FROM categories');
    console.log('Total Categories:', total[0].count);

    // Check categories with parentId
    const [withParent] = await sequelize.query('SELECT COUNT(*) as count FROM categories WHERE "parentId" IS NOT NULL');
    console.log('Categories with parentId:', withParent[0].count);

    // Check how many still have displayOrderWeb as 1
    const [stillOne] = await sequelize.query('SELECT COUNT(*) as count FROM categories WHERE "parentId" IS NOT NULL AND "displayOrderWeb" = 1');
    console.log('Subcategories still having Order 1:', stillOne[0].count);

    // Check IDs of some examples from user's JSON (6553, 6552)
    const [examples] = await sequelize.query('SELECT id, name, "parentId", "displayOrderWeb" FROM categories WHERE id IN (6553, 6552)');
    console.log('Example rows (Heels/Flats):', JSON.stringify(examples, null, 2));

  } catch (error) {
    console.error('Diagnostic failed:', error);
  } finally {
    await sequelize.close();
  }
}

run();
