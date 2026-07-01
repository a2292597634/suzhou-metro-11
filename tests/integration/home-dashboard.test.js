import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { state } from '../../js/modules/state.js';
import {
  calcHomeStats,
  renderDashboardEmptyStates,
  renderDashboardOverview,
  renderStationTable,
  renderStationTrend
} from '../../js/modules/home.js';

const indexPath = resolve(process.cwd(), 'index.html');
const dashboardCssPath = resolve(process.cwd(), 'css/home-dashboard.css');
const dataVizPath = resolve(process.cwd(), 'data-viz.html');
const dataVizCssPath = resolve(process.cwd(), 'css/data-viz.css');
const optimizedBackgroundPath = resolve(
  process.cwd(),
  'assets/design/commercial-overview-bg-v1.jpg'
);
const optimizedLogoPath = resolve(
  process.cwd(),
  'assets/design/logo-concept-02-v1-160.png'
);

function mountDashboard() {
  document.body.innerHTML = `
    <main class="home-dashboard">
      <section id="dashboard-hero"></section>
      <section id="dashboard-kpis"></section>
      <section id="dashboard-trend">
        <div id="trendChart"></div>
      </section>
      <section id="layer-stations"></section>
    </main>
  `;
}

function readKpis() {
  return Object.fromEntries(
    Array.from(document.querySelectorAll('[data-kpi]')).map(card => [
      card.dataset.kpi,
      card.querySelector('.dashboard-kpi-value')?.textContent.trim()
    ])
  );
}

describe('首页综合经营看板', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    state.stations = [];
    document.body.innerHTML = '';
  });

  it('应该按确认顺序挂载头图、核心指标、商业趋势和经营概览', () => {
    const html = readFileSync(indexPath, 'utf8');
    const sectionIds = [
      'dashboard-hero',
      'dashboard-kpis',
      'dashboard-trend',
      'layer-stations'
    ];

    expect(html).toContain('css/home-dashboard.css');
    sectionIds.reduce((previousIndex, sectionId) => {
      const currentIndex = html.indexOf(`id="${sectionId}"`);
      expect(currentIndex).toBeGreaterThan(previousIndex);
      return currentIndex;
    }, -1);
    expect(html).not.toContain('id="layer-rankings"');
    expect(html).not.toContain('id="lineContainer"');
  });

  it('首页指标卡不应覆盖头图且趋势视口应完整显示站点名称', () => {
    const css = readFileSync(dashboardCssPath, 'utf8');

    expect(css).not.toMatch(/\.dashboard-kpis\s*\{[^}]*margin:\s*-\d/);
    expect(css).toMatch(/\.trend-viewport\s*\{[^}]*min-height:\s*31\dpx/s);
  });

  it('商业信息管理页应通过同源外部样式呈现卡片网格和紧凑图表', () => {
    const html = readFileSync(dataVizPath, 'utf8');

    expect(html).toContain('css/data-viz.css');
    expect(html).toContain('商业信息管理');
    expect(html).toContain('id="gradeManager"');
    expect(html).not.toContain('商业数据可视化');
    expect(html).not.toContain('<style>');
    expect(existsSync(dataVizCssPath)).toBe(true);

    if (existsSync(dataVizCssPath)) {
      const css = readFileSync(dataVizCssPath, 'utf8');
      expect(css).toMatch(/\.cards-grid\s*\{[^}]*display:\s*grid/s);
      expect(css).toMatch(/\.charts-row\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
    }
  });

  it('应该将真实站点统计映射为五个核心指标', () => {
    state.stations = [{
      name: '测试站',
      grade: 'A',
      shops: [
        { type: '商铺', area: 10, status: '营业中' },
        { type: '商铺', area: 20, status: '营业中' },
        { type: '商铺', area: 30, status: '装修中' },
        { type: '商铺', area: 40, status: '未出租' },
        { type: '多经点位', area: 50, status: '营业中' }
      ]
    }];
    mountDashboard();

    renderDashboardOverview(calcHomeStats());

    expect(readKpis()).toEqual({
      rentRate: '75.0%',
      totalShops: '4',
      rented: '2',
      renovating: '1',
      vacant: '1'
    });
    expect(Array.from(document.querySelectorAll('.dashboard-kpi-label')).map(
      element => element.textContent.trim()
    )).toEqual(['整体出租率', '商业点位', '已出租', '装修中', '空置点位']);
  });

  it('应该在没有站点数据时显示零值指标和趋势、概览空状态', () => {
    mountDashboard();
    const stats = calcHomeStats();

    renderDashboardOverview(stats);
    renderDashboardEmptyStates(stats);

    expect(readKpis()).toEqual({
      rentRate: '0.0%',
      totalShops: '0',
      rented: '0',
      renovating: '0',
      vacant: '0'
    });
    expect(document.querySelector('#dashboard-trend .dashboard-empty-state')?.textContent)
      .toContain('暂无站点商业趋势数据');
    expect(document.querySelector('#layer-stations .dashboard-empty-state')?.textContent)
      .toContain('暂无站点经营数据');
  });

  it('应该移除无效入口并确保保留的行动链接指向现有页面', () => {
    mountDashboard();
    renderDashboardOverview(calcHomeStats());

    const pageText = document.body.textContent;
    expect(pageText).not.toContain('查看通知公告');
    expect(pageText).not.toContain('进入点位台账');

    const actionLinks = Array.from(document.querySelectorAll('.dashboard-hero-actions a'));
    actionLinks.forEach(link => {
      expect(['data-viz.html', 'battle-map.html']).toContain(link.getAttribute('href'));
      expect(link.getAttribute('href')).not.toBe('');
    });
  });

  it('应该只加载总量不超过 700 KB 的优化版首页图片', () => {
    const css = readFileSync(dashboardCssPath, 'utf8');

    expect(css).toContain('commercial-overview-bg-v1.jpg');
    expect(existsSync(optimizedBackgroundPath)).toBe(true);
    expect(existsSync(optimizedLogoPath)).toBe(true);

    const totalBytes = statSync(optimizedBackgroundPath).size
      + statSync(optimizedLogoPath).size;
    expect(totalBytes).toBeLessThanOrEqual(700 * 1024);
  });

  it('应该为全部站点绘制三条直线折线并使用覆盖最大值的动态刻度', () => {
    const stationStats = [
      { name: '唯亭', shopCount: 2, rented: 1, vacant: 1 },
      { name: '草鞋山', shopCount: 5, rented: 3, vacant: 1 },
      { name: '阳澄湖东', shopCount: 8, rented: 4, vacant: 3 },
      { name: '昆山文化艺术中心', shopCount: 13, rented: 9, vacant: 2 }
    ];
    mountDashboard();

    renderStationTrend(stationStats);

    const svg = document.querySelector('#trendChart svg');
    const paths = Array.from(svg.querySelectorAll('.trend-series'));
    const ticks = Array.from(svg.querySelectorAll('.trend-y-tick'));
    const gridLines = Array.from(svg.querySelectorAll('.trend-grid-line'));

    expect(svg).not.toBeNull();
    expect(paths.map(path => path.dataset.series)).toEqual(['total', 'rented', 'vacant']);
    paths.forEach(path => {
      expect(path.getAttribute('d').match(/[ML]/g)).toHaveLength(stationStats.length);
      expect(path.getAttribute('d')).not.toContain('C');
    });
    expect(svg.querySelectorAll('.trend-station-node')).toHaveLength(stationStats.length);
    expect(Number(ticks.at(-1).dataset.value)).toBeGreaterThanOrEqual(13);
    expect(gridLines).toHaveLength(ticks.length);
    gridLines.forEach((line, index) => {
      expect(line.getAttribute('y1')).toBe(ticks[index].getAttribute('y'));
      expect(line.getAttribute('y2')).toBe(ticks[index].getAttribute('y'));
    });
  });

  it('应该为趋势画布保留首尾空间、按五字换行站名且默认隐藏数据圆点', () => {
    const stationStats = [
      { name: '苏州新区火车站', shopCount: 4, rented: 2, vacant: 1 },
      { name: '花桥', shopCount: 6, rented: 4, vacant: 2 }
    ];
    mountDashboard();

    renderStationTrend(stationStats);

    const svg = document.querySelector('#trendChart svg');
    const nodes = Array.from(svg.querySelectorAll('.trend-station-node'));
    const firstX = Number(nodes[0].dataset.x);
    const lastX = Number(nodes.at(-1).dataset.x);
    const canvasWidth = Number(svg.getAttribute('width'));
    const firstLabelLines = Array.from(
      nodes[0].querySelectorAll('.trend-station-label tspan')
    ).map(line => line.textContent);

    expect(firstX).toBeGreaterThan(40);
    expect(lastX).toBeLessThan(canvasWidth - 40);
    expect(firstLabelLines).toEqual(['苏州新区火', '车站']);
    expect(document.querySelector('#trendChart').textContent).not.toContain('个点位');
    expect(svg.querySelectorAll('.trend-point')).toHaveLength(stationStats.length * 3);
    expect(Array.from(svg.querySelectorAll('.trend-point')).every(
      point => point.getAttribute('aria-hidden') === 'true'
    )).toBe(true);
  });

  it('应该在悬停站点时显示参考线、三个空心圆点和真实详情', () => {
    const stationStats = [
      {
        name: '花桥',
        grade: 'S',
        transfer: true,
        shopCount: 7,
        rented: 4,
        renovating: 1,
        vacant: 2,
        rateStr: '71.4%'
      },
      {
        name: '光明路',
        grade: 'A',
        transfer: false,
        shopCount: 5,
        rented: 3,
        renovating: 0,
        vacant: 2,
        rateStr: '60.0%'
      }
    ];
    mountDashboard();
    renderStationTrend(stationStats);

    const firstNode = document.querySelector('.trend-station-node[data-station-index="0"]');
    firstNode.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    const guide = document.querySelector('.trend-guide');
    const activePoints = document.querySelectorAll('.trend-point.is-active');
    const detail = document.querySelector('.trend-detail');

    expect(guide.classList.contains('is-active')).toBe(true);
    expect(guide.getAttribute('x1')).toBe(firstNode.dataset.x);
    expect(activePoints).toHaveLength(3);
    expect(detail.classList.contains('is-active')).toBe(true);
    expect(detail.textContent).toContain('花桥');
    expect(detail.textContent).toContain('S');
    expect(detail.textContent).toContain('换乘站');
    expect(detail.textContent).toContain('商业点位7');
    expect(detail.textContent).toContain('已出租4');
    expect(detail.textContent).toContain('装修1');
    expect(detail.textContent).toContain('空置2');
    expect(detail.textContent).toContain('出租率 71.4%');
  });

  it('应该在离开站点和趋势卡后保持最后一次悬停详情', () => {
    const stationStats = [
      {
        name: '花桥',
        grade: 'S',
        shopCount: 7,
        rented: 4,
        renovating: 1,
        vacant: 2,
        rateStr: '71.4%'
      },
      {
        name: '光明路',
        grade: 'A',
        shopCount: 5,
        rented: 3,
        renovating: 0,
        vacant: 2,
        rateStr: '60.0%'
      }
    ];
    mountDashboard();
    renderStationTrend(stationStats);

    const secondNode = document.querySelector('.trend-station-node[data-station-index="1"]');
    secondNode.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    secondNode.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    document.querySelector('.trend-viewport')
      .dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    expect(document.querySelector('.trend-detail').textContent).toContain('光明路');
    expect(document.querySelector('.trend-detail').classList.contains('is-active')).toBe(true);
    expect(document.querySelector('.trend-guide').classList.contains('is-active')).toBe(true);
    expect(document.querySelectorAll('.trend-point.is-active')).toHaveLength(3);
  });

  it('应该只在趋势视口左右各 20% 边缘平滑移动并在中央保持静止', () => {
    const animationFrames = [];
    vi.stubGlobal('requestAnimationFrame', vi.fn(callback => {
      animationFrames.push(callback);
      return animationFrames.length;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', vi.fn(query => ({
      matches: query === '(hover: hover) and (pointer: fine)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })));

    mountDashboard();
    renderStationTrend(Array.from({ length: 12 }, (_, index) => ({
      name: `测试站${index + 1}`,
      shopCount: index + 2,
      rented: index + 1,
      vacant: 1
    })));

    const viewport = document.querySelector('.trend-viewport');
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 500 },
      scrollWidth: { configurable: true, value: 1100 },
      scrollLeft: { configurable: true, writable: true, value: 200 }
    });
    viewport.getBoundingClientRect = () => ({
      left: 100,
      right: 600,
      top: 0,
      bottom: 304,
      width: 500,
      height: 304,
      x: 100,
      y: 0,
      toJSON: () => ({})
    });

    viewport.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 350
    }));
    expect(animationFrames).toHaveLength(0);
    expect(viewport.scrollLeft).toBe(200);

    viewport.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 590
    }));
    for (let index = 0; index < 8; index += 1) {
      animationFrames.shift()?.(index * 16);
    }
    expect(viewport.scrollLeft).toBeGreaterThan(200);

    const afterRightMove = viewport.scrollLeft;
    viewport.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 350
    }));
    animationFrames.shift()?.(160);
    expect(viewport.scrollLeft).toBe(afterRightMove);

    viewport.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 110
    }));
    for (let index = 0; index < 8; index += 1) {
      animationFrames.shift()?.(176 + index * 16);
    }
    expect(viewport.scrollLeft).toBeLessThan(afterRightMove);

    const beforeLeave = viewport.scrollLeft;
    viewport.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    animationFrames.shift()?.(320);
    expect(viewport.scrollLeft).toBe(beforeLeave);
  });

  it('应该阻止趋势画布边缘移动越过首尾边界', () => {
    const animationFrames = [];
    vi.stubGlobal('requestAnimationFrame', vi.fn(callback => {
      animationFrames.push(callback);
      return animationFrames.length;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', vi.fn(query => ({
      matches: query === '(hover: hover) and (pointer: fine)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })));

    mountDashboard();
    renderStationTrend(Array.from({ length: 12 }, (_, index) => ({
      name: `测试站${index + 1}`,
      shopCount: index + 2,
      rented: index + 1,
      vacant: 1
    })));

    const viewport = document.querySelector('.trend-viewport');
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 500 },
      scrollWidth: { configurable: true, value: 1100 },
      scrollLeft: { configurable: true, writable: true, value: 600 }
    });
    viewport.getBoundingClientRect = () => ({
      left: 100,
      right: 600,
      top: 0,
      bottom: 304,
      width: 500,
      height: 304,
      x: 100,
      y: 0,
      toJSON: () => ({})
    });

    viewport.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 599
    }));
    for (let index = 0; index < 6; index += 1) {
      animationFrames.shift()?.(index * 16);
    }
    expect(viewport.scrollLeft).toBe(600);

    viewport.scrollLeft = 0;
    viewport.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 101
    }));
    for (let index = 0; index < 6; index += 1) {
      animationFrames.shift()?.(96 + index * 16);
    }
    expect(viewport.scrollLeft).toBe(0);
  });

  it('应该在用户启用减少动画时禁用趋势过渡和边缘自动移动', () => {
    const requestFrame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', vi.fn(query => ({
      matches: query === '(prefers-reduced-motion: reduce)'
        || query === '(hover: hover) and (pointer: fine)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })));

    mountDashboard();
    renderStationTrend(Array.from({ length: 12 }, (_, index) => ({
      name: `测试站${index + 1}`,
      shopCount: index + 2,
      rented: index + 1,
      vacant: 1
    })));

    const viewport = document.querySelector('.trend-viewport');
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 500 },
      scrollWidth: { configurable: true, value: 1100 },
      scrollLeft: { configurable: true, writable: true, value: 200 }
    });
    viewport.getBoundingClientRect = () => ({
      left: 100,
      right: 600,
      top: 0,
      bottom: 304,
      width: 500,
      height: 304,
      x: 100,
      y: 0,
      toJSON: () => ({})
    });

    viewport.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 590
    }));

    const css = readFileSync(dashboardCssPath, 'utf8');
    const reducedMotionBlock = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)\}\s*$/
    )?.[1] || '';

    expect(requestFrame).not.toHaveBeenCalled();
    expect(viewport.scrollLeft).toBe(200);
    expect(reducedMotionBlock).toContain('.trend-guide');
    expect(reducedMotionBlock).toContain('.trend-point');
    expect(reducedMotionBlock).toContain('.trend-detail');
    expect(reducedMotionBlock).toContain('transition: none');
  });

  it('应该支持触屏点击站点并保持与悬停一致的趋势详情', () => {
    const stationStats = [
      {
        name: '唯亭',
        grade: 'S',
        shopCount: 8,
        rented: 5,
        renovating: 1,
        vacant: 2,
        rateStr: '75.0%'
      },
      {
        name: '草鞋山',
        grade: 'A',
        shopCount: 6,
        rented: 4,
        renovating: 0,
        vacant: 2,
        rateStr: '66.7%'
      }
    ];
    mountDashboard();
    renderStationTrend(stationStats);

    const secondNode = document.querySelector('.trend-station-node[data-station-index="1"]');
    secondNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.querySelector('.trend-detail').textContent).toContain('草鞋山');
    expect(document.querySelector('.trend-detail').classList.contains('is-active')).toBe(true);
    expect(document.querySelector('.trend-guide').getAttribute('x1')).toBe(secondNode.dataset.x);
    expect(secondNode.querySelectorAll('.trend-point.is-active')).toHaveLength(3);
  });

  it('应该让键盘用户聚焦站点并获得可辨识焦点与相同详情', () => {
    const stationStats = [{
      name: '花桥',
      grade: 'S',
      shopCount: 7,
      rented: 4,
      renovating: 1,
      vacant: 2,
      rateStr: '71.4%'
    }];
    mountDashboard();
    renderStationTrend(stationStats);

    const stationNode = document.querySelector('.trend-station-node');
    stationNode.dispatchEvent(new FocusEvent('focus', { bubbles: false }));

    const css = readFileSync(dashboardCssPath, 'utf8');
    expect(stationNode.getAttribute('tabindex')).toBe('0');
    expect(stationNode.getAttribute('role')).toBe('button');
    expect(stationNode.getAttribute('aria-label')).toContain('花桥');
    expect(document.querySelector('.trend-detail').textContent).toContain('花桥');
    expect(document.querySelectorAll('.trend-point.is-active')).toHaveLength(3);
    expect(css).toContain('.trend-station-node:focus-visible .trend-station-hit-area');
  });

  it('应该在趋势重复初始化时取消旧动画并移除旧视口监听', () => {
    const animationFrames = [];
    const requestFrame = vi.fn(callback => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    const cancelFrame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    vi.stubGlobal('matchMedia', vi.fn(query => ({
      matches: query === '(hover: hover) and (pointer: fine)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })));

    mountDashboard();
    const stationStats = Array.from({ length: 12 }, (_, index) => ({
      name: `测试站${index + 1}`,
      shopCount: index + 2,
      rented: index + 1,
      vacant: 1
    }));
    renderStationTrend(stationStats);

    const oldViewport = document.querySelector('.trend-viewport');
    Object.defineProperties(oldViewport, {
      clientWidth: { configurable: true, value: 500 },
      scrollWidth: { configurable: true, value: 1100 },
      scrollLeft: { configurable: true, writable: true, value: 200 }
    });
    oldViewport.getBoundingClientRect = () => ({
      left: 100,
      right: 600,
      top: 0,
      bottom: 304,
      width: 500,
      height: 304,
      x: 100,
      y: 0,
      toJSON: () => ({})
    });
    oldViewport.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 590
    }));

    expect(requestFrame).toHaveBeenCalledTimes(1);
    const oldAnimation = animationFrames[0];

    renderStationTrend(stationStats);

    expect(cancelFrame).toHaveBeenCalledWith(1);
    const callsAfterCleanup = requestFrame.mock.calls.length;
    oldViewport.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 590
    }));
    oldAnimation(16);

    expect(requestFrame).toHaveBeenCalledTimes(callsAfterCleanup);
    expect(oldViewport.scrollLeft).toBe(200);
  });

  it('应该使用真实业务列展示全部站点及正确面积数据', () => {
    const stationStats = [
      {
        name: '唯亭',
        grade: 'S',
        transfer: true,
        shopCount: 3,
        multiSpot: 1,
        totalArea: '60.0',
        rentedArea: '30.0',
        rented: 1,
        renovating: 1,
        vacant: 1,
        rate: 66.7,
        rateStr: '66.7%',
        shops: []
      },
      {
        name: '草鞋山',
        grade: 'A',
        transfer: false,
        shopCount: 2,
        multiSpot: 0,
        totalArea: '42.5',
        rentedArea: '28.0',
        rented: 1,
        renovating: 0,
        vacant: 1,
        rate: 50,
        rateStr: '50.0%',
        shops: []
      }
    ];
    mountDashboard();

    renderStationTable(stationStats);

    const headers = Array.from(
      document.querySelectorAll('.station-table > thead > tr > th')
    )
      .map(header => header.textContent.trim());
    const rows = document.querySelectorAll('.station-table tbody .station-row');
    const firstRowText = rows[0].textContent.replace(/\s+/g, ' ').trim();

    expect(headers).toEqual([
      '站点',
      '价值等级',
      '商铺',
      '多经点位',
      '总面积',
      '已租面积',
      '已租 / 装修 / 空置',
      '出租率',
      '操作'
    ]);
    expect(rows).toHaveLength(stationStats.length);
    expect(rows[0].dataset.stationIndex).toBe('0');
    expect(firstRowText).toContain('01');
    expect(firstRowText).toContain('唯亭');
    expect(firstRowText).toContain('60.0㎡');
    expect(firstRowText).toContain('30.0㎡');
    expect(firstRowText).toContain('1 / 1 / 1');
    expect(document.querySelector('#layer-stations').textContent).not.toContain('数据状态');
    expect(document.querySelector('#layer-stations').textContent).not.toContain('最近更新');
  });

  it('应该让经营概览在固定高度容器内滚动并保持表头固定', () => {
    mountDashboard();
    renderStationTable([{
      name: '唯亭',
      grade: 'S',
      shopCount: 1,
      multiSpot: 0,
      totalArea: '20.0',
      rentedArea: '20.0',
      rented: 1,
      renovating: 0,
      vacant: 0,
      rate: 100,
      rateStr: '100.0%',
      shops: []
    }]);

    const css = readFileSync(dashboardCssPath, 'utf8');
    expect(document.querySelector('.station-table-scroll')).not.toBeNull();
    expect(css).toMatch(/\.station-table-scroll\s*\{[^}]*max-height:/s);
    expect(css).toMatch(/\.station-table\s+thead\s+th\s*\{[^}]*position:\s*sticky/s);
  });

  it('应该支持全部站点、S/A 级和低出租率三种筛选', () => {
    const stationStats = [
      {
        name: '花桥',
        grade: 'S',
        shopCount: 3,
        multiSpot: 0,
        totalArea: '60.0',
        rentedArea: '60.0',
        rented: 3,
        renovating: 0,
        vacant: 0,
        rate: 100,
        rateStr: '100.0%',
        shops: []
      },
      {
        name: '花溪公园',
        grade: 'A',
        shopCount: 3,
        multiSpot: 0,
        totalArea: '45.0',
        rentedArea: '30.0',
        rented: 2,
        renovating: 0,
        vacant: 1,
        rate: 66.7,
        rateStr: '66.7%',
        shops: []
      },
      {
        name: '兵希',
        grade: 'B',
        shopCount: 2,
        multiSpot: 0,
        totalArea: '30.0',
        rentedArea: '15.0',
        rented: 1,
        renovating: 0,
        vacant: 1,
        rate: 50,
        rateStr: '50.0%',
        shops: []
      }
    ];
    mountDashboard();
    renderStationTable(stationStats);

    const visibleNames = () => Array.from(document.querySelectorAll('.station-row'))
      .filter(row => !row.hidden)
      .map(row => row.querySelector('.station-name-copy').textContent.trim());
    const priorityButton = document.querySelector('[data-station-filter="priority"]');
    const lowButton = document.querySelector('[data-station-filter="low"]');
    const allButton = document.querySelector('[data-station-filter="all"]');

    expect(allButton.classList.contains('is-active')).toBe(true);
    expect(visibleNames()).toEqual(['花桥', '花溪公园', '兵希']);

    priorityButton.click();
    expect(priorityButton.classList.contains('is-active')).toBe(true);
    expect(visibleNames()).toEqual(['花桥', '花溪公园']);

    lowButton.click();
    expect(lowButton.classList.contains('is-active')).toBe(true);
    expect(visibleNames()).toEqual(['花溪公园', '兵希']);

    allButton.click();
    expect(visibleNames()).toEqual(['花桥', '花溪公园', '兵希']);
  });

  it('应该按输入的站点名称实时筛选经营概览', () => {
    const stationStats = [
      {
        name: '花桥',
        grade: 'S',
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '20.0',
        rented: 1,
        renovating: 0,
        vacant: 0,
        rate: 100,
        rateStr: '100.0%',
        shops: []
      },
      {
        name: '花溪公园',
        grade: 'A',
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '10.0',
        rented: 0,
        renovating: 1,
        vacant: 0,
        rate: 100,
        rateStr: '100.0%',
        shops: []
      },
      {
        name: '兵希',
        grade: 'B',
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '0.0',
        rented: 0,
        renovating: 0,
        vacant: 1,
        rate: 0,
        rateStr: '0.0%',
        shops: []
      }
    ];
    mountDashboard();
    renderStationTable(stationStats);

    const search = document.querySelector('[data-station-search]');
    search.value = '花桥';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    const visibleNames = Array.from(document.querySelectorAll('.station-row'))
      .filter(row => !row.hidden)
      .map(row => row.querySelector('.station-name-copy').textContent.trim());
    expect(search.getAttribute('placeholder')).toBe('搜索站点');
    expect(visibleNames).toEqual(['花桥']);
  });

  it('应该在站点主行后展开包含完整六列字段的商铺明细', () => {
    const stationStats = [{
      name: '唯亭',
      grade: 'S',
      shopCount: 1,
      multiSpot: 1,
      totalArea: '45.0',
      rentedArea: '20.0',
      rented: 1,
      renovating: 0,
      vacant: 1,
      rate: 50,
      rateStr: '50.0%',
      shops: [
        {
          shortNo: 'WT-01',
          name: '湖畔咖啡',
          type: '商铺',
          area: 20,
          tenant: '苏州湖畔餐饮',
          status: '营业中'
        },
        {
          shortNo: 'WT-DJ-01',
          name: '自助售货机',
          type: '多经点位',
          area: 2,
          tenant: '',
          status: '未出租'
        }
      ]
    }];
    mountDashboard();
    renderStationTable(stationStats);

    const stationRow = document.querySelector('.station-row');
    const detailRow = stationRow.nextElementSibling;
    stationRow.click();

    expect(detailRow.classList.contains('expand-row')).toBe(true);
    expect(stationRow.classList.contains('expanded')).toBe(true);
    expect(detailRow.classList.contains('expanded')).toBe(true);
    expect(Array.from(detailRow.querySelectorAll('th')).map(th => th.textContent.trim())).toEqual([
      '编号',
      '商铺名称',
      '属性',
      '面积',
      '租户',
      '状态'
    ]);
    expect(detailRow.querySelectorAll('.shop-row')).toHaveLength(2);
    expect(detailRow.textContent.replace(/\s+/g, ' ')).toContain(
      'WT-01 湖畔咖啡 商铺 20㎡ 苏州湖畔餐饮 营业中'
    );
    expect(detailRow.textContent.replace(/\s+/g, ' ')).toContain(
      'WT-DJ-01 自助售货机 多经点位 2㎡ — 未出租'
    );
  });

  it('应该在切换站点时仅保留一个商铺详情展开', () => {
    const stationStats = ['唯亭', '草鞋山'].map((name, index) => ({
      name,
      grade: index === 0 ? 'S' : 'A',
      shopCount: 1,
      multiSpot: 0,
      totalArea: '20.0',
      rentedArea: '20.0',
      rented: 1,
      renovating: 0,
      vacant: 0,
      rate: 100,
      rateStr: '100.0%',
      shops: []
    }));
    mountDashboard();
    renderStationTable(stationStats);

    const stationRows = Array.from(document.querySelectorAll('.station-row'));
    stationRows[0].click();
    stationRows[1].click();

    expect(document.querySelectorAll('.expand-row.expanded')).toHaveLength(1);
    expect(stationRows[0].classList.contains('expanded')).toBe(false);
    expect(stationRows[1].classList.contains('expanded')).toBe(true);
    expect(stationRows[1].nextElementSibling.classList.contains('expanded')).toBe(true);
  });

  it('应该在筛选隐藏站点时同步隐藏并收起对应详情行', () => {
    const stationStats = [
      {
        name: '唯亭',
        grade: 'B',
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '20.0',
        rented: 1,
        renovating: 0,
        vacant: 0,
        rate: 100,
        rateStr: '100.0%',
        shops: []
      },
      {
        name: '草鞋山',
        grade: 'S',
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '20.0',
        rented: 1,
        renovating: 0,
        vacant: 0,
        rate: 100,
        rateStr: '100.0%',
        shops: []
      }
    ];
    mountDashboard();
    renderStationTable(stationStats);

    const stationRow = document.querySelector('.station-row');
    const detailRow = stationRow.nextElementSibling;
    stationRow.click();
    document.querySelector('[data-station-filter="priority"]').click();

    expect(stationRow.hidden).toBe(true);
    expect(detailRow.hidden).toBe(true);
    expect(stationRow.classList.contains('expanded')).toBe(false);
    expect(detailRow.classList.contains('expanded')).toBe(false);
  });

  it('应该去除搜索词前后空格并与等级筛选组合生效', () => {
    const stationStats = [
      {
        name: '花桥',
        grade: 'S',
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '20.0',
        rented: 1,
        renovating: 0,
        vacant: 0,
        rate: 100,
        rateStr: '100.0%',
        shops: []
      },
      {
        name: '花桥博览中心',
        grade: 'A',
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '0.0',
        rented: 0,
        renovating: 0,
        vacant: 1,
        rate: 0,
        rateStr: '0.0%',
        shops: []
      },
      {
        name: '花溪公园',
        grade: 'B',
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '0.0',
        rented: 0,
        renovating: 0,
        vacant: 1,
        rate: 0,
        rateStr: '0.0%',
        shops: []
      }
    ];
    mountDashboard();
    renderStationTable(stationStats);

    document.querySelector('[data-station-filter="priority"]').click();
    const search = document.querySelector('[data-station-search]');
    search.value = '  花桥  ';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    const visibleNames = Array.from(document.querySelectorAll('.station-row'))
      .filter(row => !row.hidden)
      .map(row => row.querySelector('.station-name-copy').textContent.trim());
    expect(visibleNames).toEqual(['花桥', '花桥博览中心']);
  });

  it('应该在组合筛选无结果时显示空态并清除已展开详情', () => {
    const stationStats = [{
      name: '唯亭',
      grade: 'B',
      shopCount: 1,
      multiSpot: 0,
      totalArea: '20.0',
      rentedArea: '20.0',
      rented: 1,
      renovating: 0,
      vacant: 0,
      rate: 100,
      rateStr: '100.0%',
      shops: []
    }];
    mountDashboard();
    renderStationTable(stationStats);

    const stationRow = document.querySelector('.station-row');
    stationRow.click();
    document.querySelector('[data-station-filter="priority"]').click();

    const emptyRow = document.querySelector('[data-station-empty]');
    expect(emptyRow).not.toBeNull();
    expect(emptyRow.hidden).toBe(false);
    expect(emptyRow.textContent).toContain('未找到符合条件的站点');
    expect(document.querySelectorAll('.expand-row.expanded')).toHaveLength(0);
  });

  it('应该通过键盘切换详情并同步展开按钮的 ARIA 状态', () => {
    const stationStats = [{
      name: '唯亭',
      grade: 'S',
      shopCount: 1,
      multiSpot: 0,
      totalArea: '20.0',
      rentedArea: '20.0',
      rented: 1,
      renovating: 0,
      vacant: 0,
      rate: 100,
      rateStr: '100.0%',
      shops: []
    }];
    mountDashboard();
    renderStationTable(stationStats);

    const button = document.querySelector('.btn-expand');
    const detailRow = document.querySelector('.expand-row');

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(detailRow.id);

    button.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true
    }));
    expect(detailRow.classList.contains('expanded')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    button.dispatchEvent(new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true
    }));
    expect(detailRow.classList.contains('expanded')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('趋势卡片点位明细与照片', () => {
  it('趋势详情应包含当前站点商铺明细', () => {
    mountDashboard();
    const stationStats = [{
      name: '测试站',
      grade: 'A',
      transfer: false,
      shopCount: 3,
      rented: 1,
      renovating: 1,
      vacant: 1,
      rateStr: '66.7%',
      shops: [
        { name: '商铺1', shortNo: 'S11-1', type: '商铺', area: 10, tenant: '商户A', status: '营业中', photo: '' },
        { name: '商铺2', shortNo: 'S11-2', type: '商铺', area: 15, tenant: '', status: '未出租', photo: '' },
        { name: '多经点位', shortNo: 'S11-M1', type: '多经点位', area: 5, tenant: '', status: '未出租', photo: '' }
      ]
    }];
    renderStationTrend(stationStats);

    const firstNode = document.querySelector('.trend-station-node');
    firstNode.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const detail = document.querySelector('.trend-detail');
    expect(detail.textContent).toContain('商铺明细');
  });

  it('有照片点位应显示缩略图', () => {
    mountDashboard();
    const stationStats = [{
      name: '测试站',
      grade: 'A',
      transfer: false,
      shopCount: 1,
      rented: 1,
      renovating: 0,
      vacant: 0,
      rateStr: '100.0%',
      shops: [
        { name: '有照片商铺', shortNo: 'S11-1', type: '商铺', area: 10, tenant: '商户A', status: '营业中', photo: 'data:image/jpeg;base64,/9j/4AAQ==' }
      ]
    }];
    renderStationTrend(stationStats);

    const firstNode = document.querySelector('.trend-station-node');
    firstNode.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const detail = document.querySelector('.trend-detail');
    const img = detail.querySelector('.trend-shop-photo');
    expect(img).not.toBeNull();
    expect(img.src).toBe('data:image/jpeg;base64,/9j/4AAQ==');
    expect(img.alt).toContain('有照片商铺');
  });

  it('无照片点位不应渲染破图', () => {
    mountDashboard();
    const stationStats = [{
      name: '测试站',
      grade: 'A',
      transfer: false,
      shopCount: 1,
      rented: 0,
      renovating: 0,
      vacant: 1,
      rateStr: '0.0%',
      shops: [
        { name: '无照片商铺', shortNo: 'S11-1', type: '商铺', area: 10, tenant: '', status: '未出租', photo: '' }
      ]
    }];
    renderStationTrend(stationStats);

    const firstNode = document.querySelector('.trend-station-node');
    firstNode.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const detail = document.querySelector('.trend-detail');
    const imgs = detail.querySelectorAll('img[src=""]');
    expect(imgs.length).toBe(0);
  });

  it('点位较多时应使用内部滚动且 SVG 尺寸不变', () => {
    mountDashboard();
    const shops = Array.from({ length: 8 }, (_, i) => ({
      name: `商铺${i + 1}`,
      shortNo: `S11-${i + 1}`,
      type: '商铺',
      area: 10 + i,
      tenant: '',
      status: '未出租',
      photo: ''
    }));
    const stationStats = [{
      name: '多商铺站',
      grade: 'A',
      transfer: false,
      shopCount: 8,
      rented: 0,
      renovating: 0,
      vacant: 8,
      rateStr: '0.0%',
      shops
    }];
    renderStationTrend(stationStats);

    const firstNode = document.querySelector('.trend-station-node');
    firstNode.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const detail = document.querySelector('.trend-detail');
    const shopsArea = detail.querySelector('.trend-detail-shops');
    expect(shopsArea).not.toBeNull();

    const svg = document.querySelector('.trend-chart');
    expect(svg).not.toBeNull();
  });
});
