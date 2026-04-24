const { Sequelize, QueryTypes } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT,
    dialectOptions: {
      // FORCE NO SSL for this script
    }
  }
);

async function check() {
  try {
    const columns = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'categories'",
      { type: QueryTypes.SELECT }
    );
    console.log("Columns in 'categories' table:");
    console.log(JSON.stringify(columns.map(c => c.column_name)));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
