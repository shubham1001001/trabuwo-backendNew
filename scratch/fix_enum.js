require("dotenv").config();
const { Sequelize } = require("sequelize");
const config = require("config");
const dbConfig = config.get("db");

const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: "postgres",
    port: dbConfig.port,
    logging: console.log,
    dialectOptions: {
      ssl: false // Force SSL off for this script
    }
  }
);

async function fixRolesEnum() {
  try {
    console.log("Starting fix for roles enum...");
    
    // Check if reseller exists in enum
    const [results] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE typname = 'enum_roles_name' AND enumlabel = 'reseller';
    `);

    if (results.length === 0) {
      console.log("Adding 'reseller' to enum_roles_name...");
      // Alter enum requires careful handling in Postgres
      await sequelize.query("ALTER TYPE enum_roles_name ADD VALUE IF NOT EXISTS 'reseller';");
      console.log("Successfully added 'reseller' to enum.");
    } else {
      console.log("'reseller' already exists in enum.");
    }

    console.log("Fix complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing roles enum:", err);
    process.exit(1);
  }
}

fixRolesEnum();
