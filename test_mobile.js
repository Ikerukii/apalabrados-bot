const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 375, height: 667, isMobile: true });
        
        const htmlPath = path.resolve(__dirname, 'index.html');
        await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
        
        // Comprobar scroll horizontal
        const overflowResult = await page.evaluate(() => {
            return {
                clientWidth: document.documentElement.clientWidth,
                scrollWidth: document.documentElement.scrollWidth,
                bodyWidth: document.body.getBoundingClientRect().width,
                boardWidth: document.querySelector('.board').getBoundingClientRect().width
            };
        });
        console.log("Viewport metrics on 375px mobile screen:");
        console.log(overflowResult);
        
        if(overflowResult.scrollWidth > overflowResult.clientWidth) {
            console.error("ERROR: The document is still overflowing horizontally! (Corte de pantalla)");
        } else {
            console.log("SUCCESS: No horizontal overflow detected. Widths are strictly contained.");
        }
        
        await browser.close();
    } catch(e) {
        console.error("Puppeteer NO DISPONIBLE en el entorno local u otro error:", e.message);
    }
})();
