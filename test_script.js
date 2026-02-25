const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');

const baseScript = fs.readFileSync('script.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;
const document = window.document;

try {
    // Definir entorno simulado
    window.UsageTracker = { checkAndConsume: () => true };
    eval(baseScript.replace("document.addEventListener('DOMContentLoaded', () => {", "(() => {"));
    console.log("Success! Board nodes:", document.querySelectorAll('.cell').length);
} catch (e) {
    console.error("Error:", e);
}
