
require('dotenv').config();
const { User, Role } = require('./src/modules/auth/model');
const bcrypt = require('bcryptjs');

async function checkUser() {
  try {
    const user = await User.findOne({ 
      where: { email: 'test@test.com' },
      include: [{ model: Role, as: 'Roles' }]
    });
    if (user) {
      console.log('User found:');
      // console.log(JSON.stringify(user.toJSON(), null, 2));
      
      const isMatch = await bcrypt.compare('Password@123', user.password);
      console.log('Password Match (Password@123):', isMatch);
    } else {
      console.log('User not found: test@test.com');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkUser();
