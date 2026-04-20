const { Sequelize } = require('sequelize');
require('dotenv').config();
const dao = require('../src/modules/homeCategory/dao');

async function verifySort() {
  console.log("Checking Home Page Categories sorting...");
  try {
    const results = await dao.getHomeCategoriesForHomePage();
    console.log("Retrieved categories in this order:");
    results.forEach((c, i) => {
      console.log(`${i+1}. ${c.name} (homeOrder: ${c.homeOrder}, displayOrder: ${c.displayOrder})`);
    });
    
    // Check if sorted by homeOrder
    let sorted = true;
    for(let i=0; i < results.length - 1; i++) {
        if(results[i].homeOrder > results[i+1].homeOrder) {
            sorted = false;
            break;
        }
    }
    
    if(sorted) {
        console.log("✅ Verified: Categories are sorted by homeOrder!");
    } else {
        console.log("❌ Error: Categories are NOT sorted correctly.");
    }

  } catch (err) {
    console.error("Error during verification:", err.message);
  } finally {
    process.exit(0);
  }
}

verifySort();
