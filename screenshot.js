const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 2600, height: 1200 });
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:/Users/XB/AppData/Local/Temp/v4.png', fullPage: false });
  await browser.close();
  console.log('done');
})();
