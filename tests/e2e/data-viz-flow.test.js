/**
 * data-viz 页面 E2E 测试 — Puppeteer
 *
 * 运行前需先启动服务器：node server.js
 * 运行：npx vitest run tests/e2e/data-viz-flow.test.js
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}`;

describe('data-viz 页面 E2E', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
  }, 30000);

  afterAll(async () => {
    if (browser) await browser.close();
  });

  it('页面应正常加载并显示图表', async () => {
    await page.goto(`${BASE}/data-viz.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 等待卡片渲染
    await page.waitForSelector('.station-card', { timeout: 10000 });

    // 验证图表容器存在
    const barChart = await page.$('#barChart');
    const statusChart = await page.$('#statusChart');
    expect(barChart).not.toBeNull();
    expect(statusChart).not.toBeNull();

    // 验证图表包含 SVG
    const barSvg = await page.$eval('#barChart', el => el.querySelector('svg') !== null);
    expect(barSvg).toBe(true);

    // 验证卡片数量
    const cardCount = await page.$$eval('.station-card', cards => cards.length);
    expect(cardCount).toBeGreaterThan(0);
  }, 20000);

  it('筛选 A 级后图表和卡片应同步更新', async () => {
    await page.goto(`${BASE}/data-viz.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.station-card', { timeout: 10000 });

    // 点击"A级"筛选按钮
    await page.click('[data-filter="A"]');

    // 等待渲染
    await new Promise(r => setTimeout(r, 500));

    // 验证卡片全部是 A 级
    const grades = await page.$$eval('.card-grade', els => els.map(el => el.textContent.trim()));
    expect(grades.every(g => g === 'A')).toBe(true);

    // 验证柱状图 SVG 仍然存在（已更新）
    const barSvg = await page.$eval('#barChart', el => el.querySelector('svg') !== null);
    expect(barSvg).toBe(true);
  }, 20000);

  it('展开卡片后可编辑站点信息并保存', async () => {
    await page.goto(`${BASE}/data-viz.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.station-card', { timeout: 10000 });

    // 点击第一张卡片的展开按钮
    const expandBtn = await page.$('[data-action="expand"]');
    expect(expandBtn).not.toBeNull();
    await expandBtn.click();

    // 等待详情展开
    await page.waitForSelector('.card-detail', { timeout: 5000 });

    // 验证保存按钮存在
    const saveBtn = await page.$('[data-action="save"]');
    expect(saveBtn).not.toBeNull();

    // 验证站点名称输入框存在
    const nameInput = await page.$('[data-field="name"]');
    expect(nameInput).not.toBeNull();
  }, 20000);

  it('添加新商铺后应出现在表格中', async () => {
    await page.goto(`${BASE}/data-viz.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.station-card', { timeout: 10000 });

    // 展开卡片
    const expandBtn = await page.$('[data-action="expand"]');
    await expandBtn.click();
    await page.waitForSelector('.card-detail', { timeout: 5000 });

    // 记录当前商铺行数
    const beforeCount = await page.$$eval('[data-shop-idx]', rows => rows.length);

    // 点击添加商铺
    const addBtn = await page.$('[data-add-shop]');
    await addBtn.click();
    await new Promise(r => setTimeout(r, 300));

    // 验证商铺行数增加
    const afterCount = await page.$$eval('[data-shop-idx]', rows => rows.length);
    expect(afterCount).toBe(beforeCount + 1);
  }, 20000);

  it('取消编辑应关闭详情区域', async () => {
    await page.goto(`${BASE}/data-viz.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.station-card', { timeout: 10000 });

    // 展开卡片
    await page.click('[data-action="expand"]');
    await page.waitForSelector('.card-detail', { timeout: 5000 });

    // 点击取消
    await page.click('[data-action="cancel"]');

    // 验证详情已关闭
    const detail = await page.$('.card-detail');
    expect(detail).toBeNull();
  }, 20000);

  it('切换排序后图表应更新', async () => {
    await page.goto(`${BASE}/data-viz.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.station-card', { timeout: 10000 });

    // 点击排序按钮
    await page.click('[data-sort="rate-desc"]');
    await new Promise(r => setTimeout(r, 500));

    // 验证排序按钮激活
    const isActive = await page.$eval('[data-sort="rate-desc"]', el => el.classList.contains('active'));
    expect(isActive).toBe(true);

    // 验证图表仍存在
    const barSvg = await page.$eval('#barChart', el => el.querySelector('svg') !== null);
    expect(barSvg).toBe(true);
  }, 20000);
});
