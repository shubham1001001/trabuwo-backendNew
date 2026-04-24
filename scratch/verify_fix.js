const http = require('http');

http.get('http://localhost:3000/api/category', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Success:', json.success);
      if (!json.success) {
        console.log('Error Message:', json.message);
        console.log('Details:', json.details);
      } else {
        console.log('Data length:', json.data.length);
      }
    } catch (e) {
      console.log('Response is not JSON:', data.substring(0, 100));
    }
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
