#!/usr/bin/env node
/**
 * 苏州地铁11号线商业作战图 - 高清海报导出工具
 * 用法: node tools/export-hd.js [scale]
 *   scale: 2K | 4K | 6K | 8K （默认全部导出）
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  width: 2520,
  height: 1080,
  url: 'http://localhost:8080',
  outputDir: path.join(__dirname, '..', 'output'),
  scales: [
    { name: '2K', dpr: 1,  dpi: 150, printSize: '42×18 cm', desc: '标准屏幕分辨率，适合PPT/网页' },
    { name: '4K', dpr: 2,  dpi: 150, printSize: '85×36 cm', desc: 'A1海报 / 150dpi高精度打印' },
    { name: '6K', dpr: 3,  dpi: 150, printSize: '128×54 cm', desc: 'A0海报 / 150dpi高精度打印' },
    { name: '8K', dpr: 4,  dpi: 300, printSize: '85×36 cm', desc: 'A1海报 / 300dpi专业印刷' }
  ]
};

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function exportPoster(scaleOption) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  await page.setViewport({
    width: CONFIG.width,
    height: CONFIG.height,
    deviceScaleFactor: scaleOption.dpr
  });
  
  try {
    await page.goto(CONFIG.url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
  } catch (e) {
    console.error(`❌ 无法连接到 ${CONFIG.url}`);
    console.error('   请确保本地服务器已启动: python -m http.server 8080');
    await browser.close();
    process.exit(1);
  }
  
  // 等待渲染完成 + 字体加载
  await new Promise(r => setTimeout(r, 800));

  // 注入导出优化样式：隐藏UI控件、去除圆角阴影、确保白底
  await page.addStyleTag({
    content: `
      .top-actions, .viewport-controls, .toast, .overlay, .modal { display: none !important; }
      #app { background: white !important; }
      .battle-map { border-radius: 0 !important; box-shadow: none !important; }
    `
  });
  
  const filename = `苏州地铁11号线商业作战图-${scaleOption.name}.png`;
  const outputPath = path.join(CONFIG.outputDir, filename);
  
  await page.screenshot({
    path: outputPath,
    fullPage: false,
    type: 'png',
    clip: { x: 0, y: 0, width: CONFIG.width, height: CONFIG.height }
  });
  
  await browser.close();
  
  const stats = fs.statSync(outputPath);
  const pxW = CONFIG.width * scaleOption.dpr;
  const pxH = CONFIG.height * scaleOption.dpr;
  
  return {
    name: scaleOption.name,
    path: outputPath,
    resolution: `${pxW}×${pxH}`,
    size: formatBytes(stats.size),
    dpi: scaleOption.dpi,
    printSize: scaleOption.printSize
  };
}

async function main() {
  const target = process.argv[2];
  
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  console.log('\n🎨 苏州地铁11号线商业作战图 - 高清海报导出工具\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const scalesToExport = target 
    ? CONFIG.scales.filter(s => s.name.toLowerCase() === target.toLowerCase())
    : CONFIG.scales;
  
  if (scalesToExport.length === 0) {
    console.log(`❌ 未知规格: ${target}`);
    console.log(`   可用规格: ${CONFIG.scales.map(s => s.name).join(', ')}`);
    process.exit(1);
  }
  
  const results = [];
  
  for (const scale of scalesToExport) {
    console.log(`\n📷 正在导出 ${scale.name} ...`);
    console.log(`   ${scale.desc}`);
    const result = await exportPoster(scale);
    results.push(result);
    console.log(`   ✅ ${result.resolution} | ${result.size}`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 导出完成！文件列表:\n');
  
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name}`);
    console.log(`     分辨率: ${r.resolution}`);
    console.log(`     文件大小: ${r.size}`);
    console.log(`     建议打印: ${r.printSize} @ ${r.dpi}dpi`);
    console.log(`     文件路径: ${r.path}`);
    console.log('');
  });
  
  console.log(`📁 所有文件保存在: ${CONFIG.outputDir}\n`);
}

main().catch(err => {
  console.error('❌ 导出失败:', err.message);
  process.exit(1);
});
