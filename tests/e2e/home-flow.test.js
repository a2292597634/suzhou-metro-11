/**
 * 首页 E2E 测试 — Puppeteer
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';

const BASE = `http://localhost:${process.env.PORT || 3000}`;

describe('首页 E2E', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`, { timeout: 60000 });
  }, 90000);

  afterAll(async () => {
    if (browser) await browser.close();
  });

  it('页面应正常加载并显示导航栏', async () => {
    const nav = await page.$('.topnav');
    expect(nav).not.toBeNull();
  });

  it('导航链接应包含三个页面', async () => {
    const links = await page.$$eval('.nav-link', els => els.map(el => el.dataset.page));
    expect(links).toContain('home');
    expect(links).toContain('data');
    expect(links).toContain('battle');
  });

  it('数据来源指示器应可见', async () => {
    // 等待数据加载完成（API 回退需要时间）
    await page.waitForSelector('#datasource-indicator', { timeout: 30000 });
    const text = await page.$eval('#datasource-indicator', el => el.textContent);
    expect(text.length).toBeGreaterThan(0);
  }, 60000);
});
