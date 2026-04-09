const sequelize = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function checkFields() {
  try {
    const results = await sequelize.query(
      'SELECT * FROM category_fields WHERE category_id = 6474',
      { type: QueryTypes.SELECT }
    );
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkFields();
