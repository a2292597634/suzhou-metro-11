/**
 * 响应式布局自动化验证脚本（Puppeteer）
 * 验证 6.1-6.6 的响应式布局要求
 *
 * 运行：node scripts/verify-responsive.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8081';
const PAGES = [
  { name: '首页', path: '/index.html' },
  { name: '数据页', path: '/data-viz.html' },
  { name: '作战图', path: '/battle-map.html' }
];

const VIEWPORTS = [
  { label: '桌面端', width: 1280, height: 800, minWidth: 901 },
  { label: '平板端', width: 820, height: 600, range: '768-900' },
  { label: '移动端', width: 375, height: 812, maxWidth: 768 }
];

const REPORT = [];
let failCount = 0;

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function verifyResponsive() {
  console.log('🚀 启动响应式验证...\n');

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  } catch (e) {
    console.error('❌ 无法启动 Puppeteer，请确保 Chrome/Chromium 已安装');
    console.error(e.message);
    process.exit(1);
  }

  const screenshotDir = path.resolve(__dirname, '../screenshots/responsive');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  for (const pageConfig of PAGES) {
    console.log(`\n📄 ${pageConfig.name} (${pageConfig.path})`);
    REPORT.push(`\n## ${pageConfig.name}`);

    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });

      try {
        await page.goto(`${BASE_URL}${pageConfig.path}`, { waitUntil: 'networkidle2', timeout: 15000 });
        await delay(500);
      } catch (e) {
        console.log(`   ⚠️ ${vp.label}: 页面加载失败 (${e.message})`);
        REPORT.push(`- ${vp.label}: ⚠️ 页面加载失败`);
        failCount++;
        await page.close();
        continue;
      }

      const screenshotPath = path.join(screenshotDir, `${pageConfig.name.replace(/\s/g, '-')}_${vp.label}_${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // ── 通用检查 ──
      const topnav = await page.$('.topnav');
      const bottomNav = await page.$('.bottom-nav');

      const topnavVisible = topnav ? await topnav.evaluate(el => window.getComputedStyle(el).display !== 'none') : false;
      const bottomNavVisible = bottomNav ? await bottomNav.evaluate(el => window.getComputedStyle(el).display !== 'none') : false;

      let status = '✅';
      let issues = [];

      if (vp.label === '桌面端') {
        if (!topnavVisible) issues.push('顶部导航未显示');
        if (bottomNavVisible) issues.push('底部 Tab 不应显示');
      } else if (vp.label === '平板端') {
        if (!topnavVisible) issues.push('顶部导航未显示');
        if (bottomNavVisible) issues.push('底部 Tab 不应显示');
      } else if (vp.label === '移动端') {
        if (topnavVisible) issues.push('顶部导航应隐藏');
        if (!bottomNavVisible) issues.push('底部 Tab 未显示');
      }

      if (issues.length > 0) {
        status = '❌';
      }

      console.log(`   ${status} ${vp.label} (${vp.width}x${vp.height})` +
        ` | 顶部导航: ${topnavVisible ? '显示' : '隐藏'}` +
        ` | 底部 Tab: ${bottomNavVisible ? '显示' : '隐藏'}` +
        (issues.length > 0 ? ` | 问题: ${issues.join(', ')}` : ''));

      REPORT.push(`- ${vp.label}: ${status} 顶部导航${topnavVisible ? '显示' : '隐藏'}, 底部Tab${bottomNavVisible ? '显示' : '隐藏'}` +
        (issues.length > 0 ? ` (问题: ${issues.join(', ')})` : ''));

      // ── 移动端额外检查 ──
      if (vp.label === '移动端' && pageConfig.path === '/index.html') {
        const tabItems = await page.$$('.bottom-nav .bnav-item');
        let touchTargetOk = true;
        for (let i = 0; i < tabItems.length; i++) {
          const box = await tabItems[i].boundingBox();
          if (box && (box.width < 44 || box.height < 44)) {
            touchTargetOk = false;
            issues.push(`Tab ${i+1} 尺寸 ${Math.round(box.width)}x${Math.round(box.height)} < 44x44`);
          }
        }
        console.log(`      📐 触摸目标检查: ${touchTargetOk ? '✅ 全部 ≥44px' : '❌ ' + issues[issues.length-1]}`);
      }

      // ── prefers-reduced-motion 检查 ──
      if (vp.label === '桌面端') {
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await page.reload({ waitUntil: 'networkidle2' });
        await delay(300);

        const transitionDisabled = await page.evaluate(() => {
          const el = document.querySelector('.page-section, .home-page, body');
          if (!el) return null;
          const style = window.getComputedStyle(el);
          // 检查是否有 transition-duration 为 0.01ms（我们的 reduced-motion 实现）
          return style.transitionDuration === '0.001ms' || style.transitionDuration === '0s';
        });

        const reducedMotionScreenshot = path.join(screenshotDir, `${pageConfig.name.replace(/\s/g, '-')}_reduced-motion.png`);
        await page.screenshot({ path: reducedMotionScreenshot, fullPage: true });

        console.log(`      🎬 reduced-motion: ${transitionDisabled === null ? '⚠️ 无法检测' : transitionDisabled ? '✅ 动画已禁用' : '❌ 动画未禁用'}`);
      }

      await page.close();
    }
  }

  await browser.close();

  // 输出报告
  console.log('\n' + '='.repeat(50));
  console.log('📊 响应式验证报告');
  console.log('='.repeat(50));
  console.log(REPORT.join('\n'));
  console.log('\n📁 截图保存在: screenshots/responsive/');

  // 保存报告
  const reportPath = path.resolve(__dirname, '../screenshots/responsive/REPORT.md');
  fs.writeFileSync(reportPath, '# 响应式验证报告\n\n' + REPORT.join('\n') + '\n');
  console.log('📝 报告已保存: screenshots/responsive/REPORT.md');

  if (failCount > 0) {
    console.log(`\n❌ ${failCount} 个页面加载失败，验证未通过`);
    process.exit(1);
  }
}

verifyResponsive().catch(e => {
  console.error('❌ 验证失败:', e.message);
  process.exit(1);
});
