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

  it('首页应显示确认的品牌、看板区块和全部站点', async () => {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.station-row', { timeout: 30000 });

    const overview = await page.evaluate(() => ({
      brandTitle: document.querySelector('.topnav-title')?.textContent.trim(),
      brandSubtitle: document.querySelector('.topnav-subtitle')?.textContent.trim(),
      logoSrc: document.querySelector('.topnav-logo')?.getAttribute('src'),
      hero: Boolean(document.querySelector('#dashboard-hero')),
      kpis: document.querySelectorAll('[data-kpi]').length,
      trend: Boolean(document.querySelector('#dashboard-trend')),
      stationRows: document.querySelectorAll('.station-row').length
    }));

    expect(overview).toEqual({
      brandTitle: '11号线商业信息综合平台',
      brandSubtitle: '苏州轨道交通 · 商业资产与点位管理',
      logoSrc: 'assets/design/logo-concept-02-v1-160.png',
      hero: true,
      kpis: 5,
      trend: true,
      stationRows: 28
    });
  }, 60000);

  it('三个正式页面应共享导航内容并正确标记当前页面', async () => {
    const pages = [
      { path: 'index.html', activePage: 'home' },
      { path: 'data-viz.html', activePage: 'data' },
      { path: 'battle-map.html', activePage: 'battle' }
    ];
    const expectedLinks = [
      { page: 'home', label: '经营总览', href: 'index.html' },
      { page: 'data', label: '商业分析', href: 'data-viz.html' },
      { page: 'battle', label: '线路资产', href: 'battle-map.html' }
    ];

    for (const current of pages) {
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`${BASE}/${current.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await page.waitForSelector('.topnav .nav-link', { timeout: 30000 });

      const desktop = await page.evaluate(() => ({
        links: Array.from(document.querySelectorAll('.topnav .nav-link[data-page]')).map(link => ({
          page: link.dataset.page,
          label: link.textContent.trim(),
          href: link.getAttribute('href')
        })),
        active: Array.from(document.querySelectorAll('.topnav .nav-link.active'))
          .map(link => link.dataset.page),
        current: Array.from(document.querySelectorAll('.topnav [aria-current="page"]'))
          .map(link => link.dataset.page)
      }));

      expect(desktop.links).toEqual(expectedLinks);
      expect(desktop.active).toEqual([current.activePage]);
      expect(desktop.current).toEqual([current.activePage]);

      await page.setViewport({ width: 390, height: 900 });
      const mobile = await page.evaluate(() => ({
        topnavDisplay: getComputedStyle(document.querySelector('.topnav')).display,
        bottomnavDisplay: getComputedStyle(document.querySelector('.bottom-nav')).display,
        active: Array.from(document.querySelectorAll('.bottom-nav .bnav-item.active'))
          .map(button => button.dataset.page),
        current: Array.from(document.querySelectorAll('.bottom-nav [aria-current="page"]'))
          .map(button => button.dataset.page)
      }));

      expect(mobile.topnavDisplay).toBe('none');
      expect(mobile.bottomnavDisplay).toBe('flex');
      expect(mobile.active).toEqual([current.activePage]);
      expect(mobile.current).toEqual([current.activePage]);
    }
  }, 120000);

  it('数据来源指示器应可见', async () => {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForSelector('#datasource-indicator', { timeout: 30000 });
    const text = await page.$eval('#datasource-indicator', el => el.textContent);
    expect(text.length).toBeGreaterThan(0);
  }, 60000);

  it('四个目标视口下页面主体不应水平溢出且图表和表格保持局部滚动', async () => {
    const viewports = [
      { width: 1440, expectedKpiColumns: 5 },
      { width: 980, expectedKpiColumns: 3 },
      { width: 640, expectedKpiColumns: 2 },
      { width: 390, expectedKpiColumns: 2 }
    ];

    for (const viewport of viewports) {
      await page.setViewport({ width: viewport.width, height: 900 });
      await page.goto(`${BASE}/index.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await page.waitForSelector('.station-row', { timeout: 30000 });

      const layout = await page.evaluate(() => {
        const trendViewport = document.querySelector('.trend-viewport');
        const tableViewport = document.querySelector('.station-table-scroll');
        const kpiGrid = document.querySelector('.dashboard-kpis');
        const kpiColumns = getComputedStyle(kpiGrid).gridTemplateColumns
          .split(' ')
          .filter(Boolean).length;

        return {
          viewportWidth: document.documentElement.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          kpiColumns,
          trendHasLocalScroll: trendViewport.scrollWidth > trendViewport.clientWidth,
          tableHasLocalScroll: tableViewport.scrollWidth > tableViewport.clientWidth
        };
      });

      expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.kpiColumns).toBe(viewport.expectedKpiColumns);
      expect(layout.trendHasLocalScroll).toBe(true);
      if (viewport.width <= 980) {
        expect(layout.tableHasLocalScroll).toBe(true);
      }
    }
  }, 120000);

  it('390px 手机宽度下筛选按钮和搜索框应使用完整可用宽度', async () => {
    await page.setViewport({ width: 390, height: 900 });
    await page.goto(`${BASE}/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForSelector('.station-table-tools', { timeout: 30000 });

    const controls = await page.evaluate(() => {
      const tools = document.querySelector('.station-table-tools').getBoundingClientRect();
      const filters = document.querySelector('.station-filter-group').getBoundingClientRect();
      const search = document.querySelector('.station-search').getBoundingClientRect();
      const input = document.querySelector('.station-search input').getBoundingClientRect();

      return {
        toolsWidth: tools.width,
        filtersWidth: filters.width,
        searchWidth: search.width,
        inputWidth: input.width
      };
    });

    expect(controls.filtersWidth).toBeGreaterThanOrEqual(controls.toolsWidth - 1);
    expect(controls.searchWidth).toBeGreaterThanOrEqual(controls.toolsWidth - 1);
    expect(controls.inputWidth).toBeGreaterThanOrEqual(controls.toolsWidth - 1);
  }, 60000);

  it('趋势图应在悬停后显示并保持详情，且只在边缘区域移动画布', async () => {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForSelector('.trend-station-node', { timeout: 30000 });

    await page.hover('.trend-station-node[data-station-index="0"]');
    await page.waitForSelector('.trend-detail.is-active', { timeout: 10000 });

    const hoverState = await page.evaluate(() => ({
      detailText: document.querySelector('.trend-detail')?.textContent.replace(/\s+/g, ' ').trim(),
      guideActive: document.querySelector('.trend-guide')?.classList.contains('is-active'),
      activePoints: document.querySelectorAll('.trend-point.is-active').length
    }));
    expect(hoverState.detailText).toContain('唯亭站');
    expect(hoverState.detailText).toContain('商业点位');
    expect(hoverState.detailText).toContain('已出租');
    expect(hoverState.detailText).toContain('空置');
    expect(hoverState.guideActive).toBe(true);
    expect(hoverState.activePoints).toBe(3);

    await page.hover('.trend-station-node[data-station-index="0"]');
    await new Promise(resolve => setTimeout(resolve, 400));
    const firstDetailLeft = await page.$eval(
      '.trend-detail',
      element => element.getBoundingClientRect().left
    );
    await page.hover('.trend-station-node[data-station-index="1"]');
    await new Promise(resolve => setTimeout(resolve, 400));
    const secondDetailLeft = await page.$eval(
      '.trend-detail',
      element => element.getBoundingClientRect().left
    );
    expect(secondDetailLeft).toBeGreaterThan(firstDetailLeft);

    await page.mouse.move(10, 10);
    const persistedState = await page.evaluate(() => ({
      detailActive: document.querySelector('.trend-detail')?.classList.contains('is-active'),
      guideActive: document.querySelector('.trend-guide')?.classList.contains('is-active'),
      activePoints: document.querySelectorAll('.trend-point.is-active').length
    }));
    expect(persistedState).toEqual({
      detailActive: true,
      guideActive: true,
      activePoints: 3
    });

    const viewportBox = await page.$eval('.trend-viewport', element => {
      const rect = element.getBoundingClientRect();
      element.scrollLeft = Math.min(500, element.scrollWidth - element.clientWidth);
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        scrollLeft: element.scrollLeft
      };
    });
    const centerY = viewportBox.top + Math.min(viewportBox.height / 2, 120);
    await page.mouse.move(viewportBox.left + viewportBox.width / 2, centerY);
    await new Promise(resolve => setTimeout(resolve, 250));
    const centerScroll = await page.$eval('.trend-viewport', element => element.scrollLeft);
    expect(Math.abs(centerScroll - viewportBox.scrollLeft)).toBeLessThanOrEqual(1);

    await page.mouse.move(viewportBox.left + viewportBox.width - 4, centerY);
    await new Promise(resolve => setTimeout(resolve, 350));
    const edgeScroll = await page.$eval('.trend-viewport', element => element.scrollLeft);
    expect(edgeScroll).toBeGreaterThan(centerScroll);
  }, 60000);

  it('经营概览应支持组合筛选并在切换站点时仅展开一个详情', async () => {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForSelector('.station-row', { timeout: 30000 });

    await page.click('[data-station-filter="priority"]');
    await page.type('[data-station-search]', '  花桥  ');

    const filteredNames = await page.$$eval(
      '.station-row:not([hidden]) .station-name-copy',
      elements => elements.map(element => element.textContent.trim())
    );
    expect(filteredNames).toEqual(['花桥博览中心站', '花桥站']);

    await page.click('.station-row:not([hidden]) .btn-expand');
    let expanded = await page.evaluate(() => ({
      rows: document.querySelectorAll('.expand-row.expanded').length,
      station: document.querySelector('.station-row.expanded .station-name-copy')?.textContent.trim(),
      aria: document.querySelector('.station-row.expanded .btn-expand')?.getAttribute('aria-expanded'),
      headers: Array.from(document.querySelectorAll('.expand-row.expanded .shop-table th'))
        .map(header => header.textContent.trim())
    }));
    expect(expanded.rows).toBe(1);
    expect(expanded.station).toBe('花桥博览中心站');
    expect(expanded.aria).toBe('true');
    expect(expanded.headers).toEqual(['编号', '商铺名称', '属性', '面积', '租户', '状态']);

    const visibleButtons = await page.$$('.station-row:not([hidden]) .btn-expand');
    await visibleButtons[1].click();
    expanded = await page.evaluate(() => ({
      rows: document.querySelectorAll('.expand-row.expanded').length,
      station: document.querySelector('.station-row.expanded .station-name-copy')?.textContent.trim(),
      previousAria: document.querySelector(
        '.station-row:not([hidden]) .btn-expand'
      )?.getAttribute('aria-expanded')
    }));
    expect(expanded).toEqual({
      rows: 1,
      station: '花桥站',
      previousAria: 'false'
    });
  }, 60000);

  it('首页应遵守同源 CSP 且不产生外部资源、静态资源失败或运行时错误', async () => {
    const securityPage = await browser.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const failedResponses = [];
    const externalRequests = [];
    const baseOrigin = new URL(BASE).origin;

    securityPage.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    securityPage.on('pageerror', error => pageErrors.push(error.message));
    securityPage.on('requestfailed', request => failedRequests.push(request.url()));
    securityPage.on('request', request => {
      const url = request.url();
      if (url.startsWith('http') && new URL(url).origin !== baseOrigin) {
        externalRequests.push(url);
      }
    });
    securityPage.on('response', response => {
      const url = response.url();
      if (response.status() >= 400 && !url.endsWith('/api/data')) {
        failedResponses.push(`${response.status()} ${url}`);
      }
    });

    try {
      await securityPage.setViewport({ width: 1440, height: 900 });
      const response = await securityPage.goto(`${BASE}/index.html`, {
        waitUntil: 'networkidle0',
        timeout: 60000
      });
      await securityPage.waitForSelector('.station-row', { timeout: 30000 });
      await securityPage.hover('.trend-station-node');
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(response.headers()['content-security-policy']).toBe("default-src 'self'");
      expect(externalRequests).toEqual([]);
      expect(failedRequests).toEqual([]);
      expect(failedResponses).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    } finally {
      await securityPage.close();
    }
  }, 90000);
});
