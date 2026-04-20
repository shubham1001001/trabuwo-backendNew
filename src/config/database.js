const { Sequelize } = require("sequelize");
const config = require("config");
const logger = require("./logger");

const dbConfig = config.get("db");
/*IMPROVEMNT Connection Pooling etc before production */
const isLocalhost = dbConfig.host === "127.0.0.1" || dbConfig.host === "localhost";

const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: "postgres",
    port: dbConfig.port,
    /*Remember to REMOVE THIS BEFORE DEPLOYING TO PRODUCTION*/
    logging: (msg) => {
      logger.info(`[Sequelize] ${msg}`);
    },
    ...(isLocalhost ? {} : {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }),

    pool: {
      max: 5, // Maximum connections - optimized for 0.1 CPU Render instance
      min: 2, // Minimum connections - maintains warm connections
      acquire: 30000, // Max time (ms) to get connection - 30 seconds for resource-constrained instance
      idle: 10000, // Max idle time before release - 10 seconds to free up resources quickly
      evict: 10000, // Check for idle connections every 10s - keeps pool lean and responsive
    },
  }
);

module.exports = sequelize;
