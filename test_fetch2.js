const https = require('https');
const url = 'https://raw.githubusercontent.com/fcanas/scrabble-es/master/board/apalabrados.json'\;
https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body.substring(0, 500)));
});
