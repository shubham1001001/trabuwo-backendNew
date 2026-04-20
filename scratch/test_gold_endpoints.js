require("dotenv").config();
const axios = require("axios");

async function testEndpoints() {
  const baseUrl = "http://localhost:3000/api/"; // Since we set VITE_API_URL to localhost:3000
  
  console.log("--- TESTING BACKEND ENDPOINTS ---");
  
  const endpoints = [
    "gold-section/settings",
    "category",
    "gold-section/tiles"
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Checking ${baseUrl}${endpoint}...`);
      const response = await axios.get(`${baseUrl}${endpoint}`);
      console.log(`✅ Success: ${endpoint}`);
      console.log(`Data Type: ${Array.isArray(response.data.data) ? "Array" : typeof response.data.data}`);
      if (Array.isArray(response.data.data)) {
        console.log(`Count: ${response.data.data.length}`);
      }
    } catch (error) {
      console.error(`❌ Failed: ${endpoint} - ${error.message}`);
      if (error.response) {
          console.error(`Status: ${error.response.status}`);
          console.error(`Response:`, JSON.stringify(error.response.data));
      }
    }
    console.log("-----------------------------------");
  }
}

testEndpoints();
