const Category = require('./src/modules/category/model');
const { buildCategoryTree } = require('./src/modules/category/helper');
const sequelize = require('./src/config/database');

// Override logging to see what happens
async function test() {
  try {
    // We use the real sequelize instance which has SSL configured in database.js
    const categories = await Category.findAll({
      where: { isDeleted: false, isVisible: true }
    });
    
    console.log('Total categories fetched:', categories.length);
    
    const tree = buildCategoryTree(categories, null);
    
    console.log('--- FINAL TREE ROOTS (Top 10) ---');
    tree.slice(0, 10).forEach(node => {
      console.log(`[Root] ${node.id} - ${node.name} - Order: ${node.displayOrderWeb}`);
    });
    
    const popular = tree.find(n => n.name === 'Popular');
    const heels = tree.find(n => n.name === 'Heels');
    const flats = tree.find(n => n.name === 'Flats');
    
    if (popular) console.log('Popular found at index:', tree.indexOf(popular));
    if (heels) console.log('Heels found at index:', tree.indexOf(heels));
    if (flats) console.log('Flats found at index:', tree.indexOf(flats));

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    await sequelize.close();
  }
}
test();
