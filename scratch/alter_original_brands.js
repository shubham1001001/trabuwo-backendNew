require("dotenv").config();
const sequelize = require("../src/config/database");

async function addColumns() {
  try {
    await sequelize.authenticate();
    console.log("Connected");
    
    await sequelize.query(`
      ALTER TABLE original_brand_categories 
      ADD COLUMN IF NOT EXISTS mobile_banner_img_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS mobile_banner_redirect_category_id INTEGER REFERENCES categories(id);
    `);
    
    console.log("Columns added successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addColumns();
