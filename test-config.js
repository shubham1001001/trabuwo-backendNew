require('dotenv').config();
const config = require('config');
try {
    console.log('DB Config Test:');
    console.log('Host:', config.get('db.host'));
    console.log('User:', config.get('db.user'));
    console.log('DB Name:', config.get('db.name'));
} catch (e) {
    console.error('Config Error:', e.message);
}
