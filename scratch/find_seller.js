require('dotenv').config();
process.env.DB_SSL = 'false';
const { User, Role } = require('../src/modules/auth/model');

async function findSeller() {
  try {
    const user = await User.findOne({
      include: [{
        model: Role,
        where: { name: 'seller' }
      }]
    });
    console.log(JSON.stringify(user, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

findSeller();
