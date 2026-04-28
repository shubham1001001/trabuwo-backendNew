const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
process.env.NODE_CONFIG_DIR = path.join(__dirname, '../config');
console.log('DB_HOST from env:', process.env.DB_HOST);
const sequelize = require('../src/config/database');
const { PlatformConfig, CategoryCommission } = require('../src/modules/platformConfig/model');
const { Wallet, WalletTransaction, PlatformLedger, PayoutRequest } = require('../src/modules/wallet/model');

async function syncModels() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    // Force sync for new tables to handle ENUM changes
    await PlatformConfig.sync({ force: true });
    await CategoryCommission.sync({ force: true });
    await Wallet.sync({ force: true });
    await WalletTransaction.sync({ force: true });
    await PlatformLedger.sync({ force: true });
    await PayoutRequest.sync({ force: true });
    
    console.log('Financial & Config models synced successfully.');
    
    // Seed defaults
    const platformConfigService = require('../src/modules/platformConfig/service');
    await platformConfigService.seedDefaults();
    console.log('Platform configurations seeded.');

  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    await sequelize.close();
  }
}

syncModels();
