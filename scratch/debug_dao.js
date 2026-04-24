const { Sequelize } = require('sequelize');
const MobileCategorySection = require('../src/modules/mobileCategorySection/model');
const Category = require('../src/modules/category/model');

async function test() {
    try {
        const sequelize = MobileCategorySection.sequelize;
        await sequelize.authenticate();
        console.log('DB connected');
        
        const sections = await MobileCategorySection.findAll({
            include: [{ model: Category, as: 'category' }]
        });
        console.log('Sections found:', sections.length);
        if (sections.length > 0) {
            console.log('First section category:', sections[0].category.name);
        }
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

test();
