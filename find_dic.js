const https = require('https');
const options = {
  hostname: 'api.github.com',
  path: '/search/repositories?q=apalabrados+dictionaries',
  headers: {'User-Agent': 'node.js'}
};
https.get(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body.substring(0, 500)));
});
