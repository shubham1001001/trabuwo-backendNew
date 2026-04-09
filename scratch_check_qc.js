const axios = require('axios');

async function check() {
    try {
        const resp = await axios.get('http://localhost:3000/api/catalogue/status/qc_in_progress');
        console.log("Response:", JSON.stringify(resp.data, null, 2));
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}

check();
