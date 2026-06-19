/**
 * data-viz 页面 E2E 测试 — Puppeteer
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';

const BASE = `http://localhost:${process.env.PORT || 3000}`;

describe('data-viz 页面 E2E', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/data-viz.html`, { timeout: 60000 });
    await page.waitForSelector('.station-card', { timeout: 30000 });
  }, 120000);

  afterAll(async () => {
    if (browser) await browser.close();
  });

  it('商业信息管理页应应用站点卡片网格并控制图表首屏比例', async () => {
    const layout = await page.evaluate(() => {
      const grid = document.querySelector('.cards-grid');
      const card = document.querySelector('.station-card');
      const charts = document.querySelector('.charts-row');
      const chart = document.querySelector('.chart-container');
      const gradeManager = document.querySelector('#gradeManager');
      return {
        title: document.querySelector('.page-title')?.textContent.trim(),
        gridDisplay: getComputedStyle(grid).display,
        cardWidth: card.getBoundingClientRect().width,
        gridWidth: grid.getBoundingClientRect().width,
        chartsDisplay: getComputedStyle(charts).display,
        chartHeight: chart.getBoundingClientRect().height,
        gradeSummaryCount: gradeManager.querySelectorAll('[data-grade-summary]').length,
        gradeRows: gradeManager.querySelectorAll('[data-grade-row]').length
      };
    });

    expect(layout.title).toBe('商业信息管理');
    expect(layout.gridDisplay).toBe('grid');
    expect(layout.cardWidth).toBeLessThan(layout.gridWidth / 2);
    expect(layout.chartsDisplay).toBe('grid');
    expect(layout.chartHeight).toBeLessThan(400);
    expect(layout.gradeSummaryCount).toBe(4);
    expect(layout.gradeRows).toBeGreaterThan(0);
  });

  it('页面应正常加载并显示图表', async () => {
    const barChart = await page.$('#barChart');
    const statusChart = await page.$('#statusChart');
    expect(barChart).not.toBeNull();
    expect(statusChart).not.toBeNull();
    const barSvg = await page.$eval('#barChart', el => el.querySelector('svg') !== null);
    expect(barSvg).toBe(true);
  });

  it('导航栏应显示数据来源指示器', async () => {
    await page.waitForSelector('#datasource-indicator', { timeout: 30000 });
    const indicator = await page.$('#datasource-indicator');
    expect(indicator).not.toBeNull();
  }, 60000);

  it('筛选 A 级后图表应更新', async () => {
    await page.click('[data-filter="A"]');
    await new Promise(r => setTimeout(r, 1000));
    const barSvg = await page.$eval('#barChart', el => el.querySelector('svg') !== null);
    expect(barSvg).toBe(true);
  });

  it('展开卡片后详情区域可见', async () => {
    // 先恢复全部筛选
    await page.click('[data-filter="all"]');
    await new Promise(r => setTimeout(r, 500));
    // 展开第一张卡片
    const expandBtn = await page.$('[data-action="expand"]');
    if (expandBtn) {
      await expandBtn.click();
      await page.waitForSelector('.card-detail', { timeout: 10000 });
      const detail = await page.$('.card-detail');
      expect(detail).not.toBeNull();
    }
  }, 30000);
});
