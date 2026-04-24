const sequelize = require('../src/config/database');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connected');
        const [results] = await sequelize.query("SELECT * FROM information_schema.tables WHERE table_name = 'mobile_category_sections'");
        console.log('Table exists:', results.length > 0);
        if (results.length > 0) {
             const [cols] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mobile_category_sections'");
             console.log('Columns:', cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
        }
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

check();
