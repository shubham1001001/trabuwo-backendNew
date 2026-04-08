const Category = require('./src/modules/category/model');
const sequelize = require('./src/config/database');
const { Op } = require('sequelize');

async function test() {
  try {
    console.log('--- TESTING SEQUELIZE SORTING V2 ---');
    const results = await Category.findAll({
      where: { isDeleted: false, isVisible: true },
      order: [
        ['displayOrderWeb', 'ASC NULLS LAST'],
        ['name', 'ASC']
      ],
      limit: 10,
    });

    console.log('Results (ID / Name / Order):');
    results.forEach(r => {
      console.log(` - ${r.id} / ${r.name} / ${r.displayOrderWeb}`);
    });

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    await sequelize.close();
  }
}

test();
