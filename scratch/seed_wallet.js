const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
process.env.NODE_CONFIG_DIR = path.join(__dirname, '../config');
const sequelize = require('../src/config/database');
const { Wallet } = require('../src/modules/wallet/model');
const { User } = require('../src/modules/auth/model');

async function seedWallet() {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: 'test@test.com' } });
    if (!user) {
      console.log('User test@test.com not found');
      return;
    }

    await Wallet.findOrCreate({
      where: { userId: user.id },
      defaults: {
        pendingBalance: 1500.50,
        availableBalance: 5000.00,
        lockedBalance: 0.00
      }
    });
    console.log('Wallet seeded for test@test.com');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await sequelize.close();
  }
}

seedWallet();
