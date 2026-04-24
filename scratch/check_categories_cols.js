const sequelize = require('../src/config/database');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connected');
        const [cols] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'categories'");
        console.log('Columns:', cols.map(c => `${c.column_name}`).join(', '));
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

check();
