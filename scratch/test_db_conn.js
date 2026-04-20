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
    logging: false
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    process.exit(1);
  }
}

testConnection();
