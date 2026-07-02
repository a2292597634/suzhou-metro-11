/**
 * data-viz 页面 E2E 测试 — Puppeteer
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { launchBrowser } from './browser-helper.js';

const BASE = `http://localhost:${process.env.PORT || 3000}`;
const require = createRequire(import.meta.url);
const E2E_PHOTO_PNG = resolve(process.cwd(), 'tests/fixtures/e2e-shop-photo.png');
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
);

function ensurePhotoFixture() {
  mkdirSync(dirname(E2E_PHOTO_PNG), { recursive: true });
  writeFileSync(E2E_PHOTO_PNG, PNG_1X1);
}

function buildStation(shopUid) {
  return {
    id: `e2e-photo-station-${shopUid}`,
    name: `E2E照片站${shopUid.slice(-4)}`,
    grade: 'S',
    x: 2990,
    y: 2990,
    pos: 'top',
    transfer: false,
    shops: [{
      shopUid,
      no: 1,
      shortNo: 'E2E-01',
      name: `E2E照片铺${shopUid.slice(-4)}`,
      type: '商铺',
      area: 10,
      tenant: '',
      contact: '',
      openDate: '',
      status: '营业中',
      remark: '',
      photo: '',
      photoHash: ''
    }]
  };
}

async function loginAndSeed(page, shopUid) {
  const station = buildStation(shopUid);
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(async data => {
    const login = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: 'test-secret-token' })
    });
    if (!login.ok) throw new Error(`login failed ${login.status}`);
    const save = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ data })
    });
    if (!save.ok) throw new Error(`seed failed ${save.status}`);
  }, { stations: [station], globalStats: {}, gradeInfo: {} });
}

async function openSeededDataViz(page, shopUid) {
  await page.goto(`${BASE}/data-viz.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const stationSelector = `.station-card[data-id="e2e-photo-station-${shopUid}"]`;
  await page.waitForSelector(stationSelector, { timeout: 30000 });
  await page.click(`${stationSelector} [data-action="expand"]`);
  await page.waitForSelector(`${stationSelector} .card-detail`, { timeout: 10000 });
  return stationSelector;
}

async function uploadPhotoThroughUi(page, shopUid) {
  const stationSelector = await openSeededDataViz(page, shopUid);
  const [chooser] = await Promise.all([
    page.waitForFileChooser({ timeout: 10000 }),
    page.click(`${stationSelector} [data-photo-action="import"], [data-photo-action="replace"]`)
  ]);
  await chooser.accept([E2E_PHOTO_PNG]);
  await page.waitForFunction(
    uid => document.querySelector('.photo-thumb')?.getAttribute('src')?.includes(`/api/shop-photos/${uid}`),
    { timeout: 30000 },
    shopUid
  );
  return stationSelector;
}

describe('data-viz 页面 E2E', () => {
  let browser, page;

  beforeAll(async () => {
    ensurePhotoFixture();
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/data-viz.html`, { timeout: 60000 });
    await page.waitForSelector('.station-card', { timeout: 30000 });
  }, 120000);

  afterAll(async () => {
    if (browser) await browser.close();
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      await prisma.shopPhoto.deleteMany({ where: { shopUid: { startsWith: 'e2e_' } } });
      await prisma.shop.deleteMany({ where: { shopUid: { startsWith: 'e2e_' } } });
      await prisma.station.deleteMany({ where: { id: { startsWith: 'e2e-photo-station-' } } });
    } finally {
      await prisma.$disconnect();
    }
    if (existsSync(E2E_PHOTO_PNG)) rmSync(E2E_PHOTO_PNG, { force: true });
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

  it('上传真实照片、保存并刷新后仍应显示照片', async () => {
    const shopUid = 'e2e_upload_shop';
    await loginAndSeed(page, shopUid);
    await uploadPhotoThroughUi(page, shopUid);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await openSeededDataViz(page, shopUid);

    const src = await page.$eval('.photo-thumb', img => img.getAttribute('src'));
    expect(src).toContain(`/api/shop-photos/${shopUid}`);
  }, 90000);

  it('删除真实照片并刷新后应清空预览', async () => {
    const shopUid = 'e2e_delete_shop';
    await loginAndSeed(page, shopUid);
    const stationSelector = await uploadPhotoThroughUi(page, shopUid);

    page.once('dialog', dialog => dialog.accept());
    await page.click(`${stationSelector} [data-photo-action="delete"]`);
    await page.waitForSelector(`${stationSelector} .photo-placeholder`, { timeout: 30000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await openSeededDataViz(page, shopUid);

    expect(await page.$('.photo-thumb')).toBeNull();
    expect(await page.$('.photo-placeholder')).not.toBeNull();
  }, 90000);

  it('静态快照导出后静态图片路径应可由同源页面访问', async () => {
    const shopUid = 'e2e_static_shop';
    await loginAndSeed(page, shopUid);
    await uploadPhotoThroughUi(page, shopUid);

    const defaultDataPath = resolve(process.cwd(), 'data/default-data.json');
    const manifestPath = resolve(process.cwd(), 'data/static-manifest.json');
    const assetsDir = resolve(process.cwd(), 'assets/shop-photos');
    const oldDefaultData = existsSync(defaultDataPath) ? readFileSync(defaultDataPath) : null;
    const { exportStaticSnapshot } = require('../../tools/export-static-snapshot.js');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    let snapshot;
    try {
      snapshot = await exportStaticSnapshot({ prisma, outputRoot: process.cwd(), generatedAt: new Date('2026-07-01T00:00:00.000Z') });
      const exported = snapshot.photos.find(photo => photo.shopUid === shopUid);
      expect(exported?.path).toMatch(new RegExp(`^/assets/shop-photos/${shopUid}-[a-f0-9]{12}\\.png$`));
      const response = await page.goto(`${BASE}${exported.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      expect(response.status()).toBe(200);
    } finally {
      await prisma.$disconnect();
      if (oldDefaultData) writeFileSync(defaultDataPath, oldDefaultData);
      if (existsSync(manifestPath)) rmSync(manifestPath, { force: true });
      if (existsSync(assetsDir)) rmSync(assetsDir, { recursive: true, force: true });
    }
  }, 120000);
  it('展开卡片后详情区域可见', async () => {
    await page.goto(`${BASE}/data-viz.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-filter="all"]', { timeout: 30000 });
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
