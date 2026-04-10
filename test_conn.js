require("dotenv").config();
const config = require("config");
const { Sequelize, QueryTypes } = require("sequelize");

const dbConfig = config.get("db");
console.log("DB Config:", { ...dbConfig, password: "****" });

async function test() {
  const sequelize = new Sequelize(
    dbConfig.name,
    dbConfig.user,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: "postgres",
      port: dbConfig.port,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }
  );

  try {
    await sequelize.authenticate();
    console.log("Connection successful with SSL.");
  } catch (err) {
    console.log("SSL connection failed, trying without SSL...");
    const sequelizeNoSsl = new Sequelize(
      dbConfig.name,
      dbConfig.user,
      dbConfig.password,
      {
        host: dbConfig.host,
        dialect: "postgres",
        port: dbConfig.port,
        dialectOptions: {
          ssl: false
        },
      }
    );
    try {
      await sequelizeNoSsl.authenticate();
      console.log("Connection successful WITHOUT SSL.");
    } catch (err2) {
      console.error("All connection attempts failed.");
      console.error("No SSL Error:", err2.message);
    }
  }
}

test();
