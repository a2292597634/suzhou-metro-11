/**
 * 作战图 E2E 测试 — Puppeteer
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchBrowser } from './browser-helper.js';

const BASE = `http://localhost:${process.env.PORT || 3000}`;

describe('作战图 E2E', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/battle-map.html`, { timeout: 60000 });
  }, 90000);

  afterAll(async () => {
    if (browser) await browser.close();
  });

  it('页面应正常加载并显示导航栏', async () => {
    const nav = await page.$('.topnav');
    expect(nav).not.toBeNull();
  });

  it('作战图页面标题可见', async () => {
    const title = await page.$('.main-title');
    expect(title).not.toBeNull();
  });

  it('数据来源指示器应可见', async () => {
    await page.waitForSelector('#datasource-indicator', { timeout: 30000 });
    const indicator = await page.$('#datasource-indicator');
    expect(indicator).not.toBeNull();
  }, 60000);
});
