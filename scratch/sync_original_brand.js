const sequelize = require('../src/config/database');
const OriginalBrandCategory = require('../src/modules/originalBrand/originalBrandModel');

async function sync() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Sync only the OriginalBrandCategory model
    await OriginalBrandCategory.sync({ alter: true });
    console.log('OriginalBrandCategory table has been synchronized (altered).');
    
    // List columns to verify
    const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'original_brand_categories'");
    console.log('Current columns:', results.map(r => r.column_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

sync();
