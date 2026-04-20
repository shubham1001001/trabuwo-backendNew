require('dotenv').config();
const config = require("config");

module.exports = {
  development: {
    username: config.get("db.user"),
    password: config.get("db.password"),
    database: config.get("db.name"),
    host: config.get("db.host"),
    port: config.get("db.port"),
    dialect: "postgres",
  },
  test: {
    username: config.get("db.user"),
    password: config.get("db.password"),
    database: config.get("db.name"),
    host: config.get("db.host"),
    port: config.get("db.port"),
    dialect: "postgres",
  },
  production: {
    username: config.get("db.user"),
    password: config.get("db.password"),
    database: config.get("db.name"),
    host: config.get("db.host"),
    port: config.get("db.port"),
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
