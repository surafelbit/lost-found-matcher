import { request } from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/messages/1/4',
  method: 'GET',
};

const req = request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
});

req.on('error', e => console.error(e));
req.end();
