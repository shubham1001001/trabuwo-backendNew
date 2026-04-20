require("dotenv").config();
const sequelize = require("./src/config/database");
const glob = require("glob");
const path = require("path");

async function runAutoSync() {
  try {
    await sequelize.authenticate();
    console.log("Database connected for auto-sync.");

    const fs = require('fs');

    const getAllFiles = function(dirPath, arrayOfFiles) {
      const files = fs.readdirSync(dirPath)
      arrayOfFiles = arrayOfFiles || []
      files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
          arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
          arrayOfFiles.push(path.join(dirPath, "/", file))
        }
      })
      return arrayOfFiles
    }

    const allFiles = getAllFiles("src/modules");
    const modelFiles = allFiles.filter(f => f.toLowerCase().includes('model.js'));
    
    console.log(`Found ${modelFiles.length} model files. Syncing...`);
    
    // Register them all
    for (const file of modelFiles) {
        try {
            require(path.resolve(file));
        } catch (err) {
            // Some might not be Sequelize models, just controller logic named 'model.js', so we catch gracefully
        }
    }

    // Now run Sequelize's alter: true
    // This will examine all loaded tables, check the DB columns, and add missing or drop extra attributes mechanically.
    await sequelize.sync({ alter: true, logging: msg => {
        if(msg.includes('ALTER TABLE') || msg.includes('CREATE TABLE')) {
            console.log('[SYNC DETECTED DIFFERENCE]:', msg);
        }
    }});

    console.log("Entire Database beautifully synchronized with code Models.");
    process.exit(0);

  } catch (error) {
    console.error("Auto-sync failed:", error);
    process.exit(1);
  }
}

runAutoSync();
