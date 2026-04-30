require('dotenv').config();
const axios = require('axios');

async function testAuth() {
    try {
        const email = process.env.SHIPROCKET_EMAIL;
        const password = process.env.SHIPROCKET_PASSWORD;
        console.log(`Testing Shiprocket Auth for email: ${email}`);
        
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email: email,
            password: password
        });
        
        console.log('Auth Success!');
        console.log('Token:', response.data.token);
    } catch (error) {
        console.error('Auth Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testAuth();
