const axios = require('axios');

async function test() {
  try {
    const response = await axios.get('http://127.0.0.1:3000/api/order/buyer/cancel-reasons', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI4Iiwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNzc4NzgxOTA4LCJleHAiOjE3Nzg4MTc5MDh9.z8EgSiODA8xwX1qm58dBbphHDcbaSZr75cqps0-ks5A',
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

test();
