const https = require('https');
const url = 'https://raw.githubusercontent.com/javier-san/apalabrados-solver/master/src/board.js'\;
https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body.substring(0, 500)));
});
