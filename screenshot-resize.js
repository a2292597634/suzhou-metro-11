const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // 先以大窗口打开
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:/Users/XB/AppData/Local/Temp/v5-large.png', fullPage: false });
  
  // 模拟 resize 到小窗口（类似高 DPI 缩放后）
  await page.setViewport({ width: 1366, height: 768 });
  // 等待 resize 防抖处理（150ms + 缓冲）
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'C:/Users/XB/AppData/Local/Temp/v5-small.png', fullPage: false });
  
  // 再 resize 到更小的窗口
  await page.setViewport({ width: 1024, height: 768 });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'C:/Users/XB/AppData/Local/Temp/v5-tiny.png', fullPage: false });
  
  await browser.close();
  console.log('done');
})();
