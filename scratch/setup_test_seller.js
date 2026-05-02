require('dotenv').config();
process.env.DB_SSL = 'false';
const { User, Role } = require('../src/modules/auth/model');
const bcrypt = require('bcryptjs');

async function setupTestSeller() {
  try {
    const sellerRole = await Role.findOne({ where: { name: 'seller' } });
    if (!sellerRole) {
      console.log('Seller role not found');
      return;
    }

    let user = await User.findOne({ where: { email: 'test@seller.com' } });
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      user = await User.create({
        email: 'test@seller.com',
        password: hashedPassword,
        mobile: '9999999999',
        fullName: 'Test Seller',
        status: 'active'
      });
      await user.addRole(sellerRole);
      console.log('Test seller created');
    } else {
      console.log('Test seller already exists');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

setupTestSeller();
