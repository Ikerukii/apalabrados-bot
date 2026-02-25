const fs = require('fs');
const content = fs.readFileSync('firebase-auth.js', 'utf8');
try {
  new Function(content);
  console.log("Syntax is OK");
} catch(e) {
  console.log("Syntax Error:", e);
}
