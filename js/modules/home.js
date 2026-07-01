/**
 * 首页数据看板 —— 三层结构
 * 1. 综合数据概览  2. 站点总览（可展开）  3. 排名统计
 */

import { loadData, calcGlobalStats } from './data.js';
import { state } from './state.js';
import { escapeHtml, escapeAttr, getGradeClass, normalizeGrade } from './utils.js';

let cleanupStationTrend = null;

// ============================================
// 数据计算
// ============================================

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clampPercentage(value) {
  return Math.min(100, Math.max(0, toFiniteNumber(value)));
}

function getShopStatusClass(status, prefix = 'status-') {
  if (status === '营业中') return `${prefix}rented`;
  if (status === '装修中') return `${prefix}renovating`;
  return `${prefix}vacant`;
}

function getNiceTickStep(rawStep) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceFactor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceFactor * magnitude;
}

export function createYAxisTicks(maxValue, divisions = 4) {
  const safeDivisions = Math.max(1, Math.floor(toFiniteNumber(divisions)) || 4);
  const safeMax = Math.max(0, toFiniteNumber(maxValue));
  const step = getNiceTickStep(safeMax / safeDivisions);

  return Array.from({ length: safeDivisions + 1 }, (_, index) => index * step);
}

export function buildTrendPoints(stationStats, {
  plotWidth = 0,
  plotHeight = 0,
  yMax = 0
} = {}) {
  const stations = Array.isArray(stationStats) ? stationStats : [];
  const width = Math.max(0, toFiniteNumber(plotWidth));
  const height = Math.max(0, toFiniteNumber(plotHeight));
  const scaleMax = Math.max(1, toFiniteNumber(yMax));
  const xStep = stations.length > 1 ? width / (stations.length - 1) : 0;
  const toY = value => height - (Math.min(scaleMax, Math.max(0, toFiniteNumber(value))) / scaleMax * height);

  return stations.map((station, index) => ({
    x: index * xStep,
    totalY: toY(station?.shopCount),
    rentedY: toY(station?.rented),
    vacantY: toY(station?.vacant)
  }));
}

export function formatStationNameLines(name, maxCharacters = 5) {
  const characters = Array.from(String(name || ''));
  const lineLength = Math.max(1, Math.floor(toFiniteNumber(maxCharacters)) || 5);
  const lines = [];

  for (let index = 0; index < characters.length; index += lineLength) {
    lines.push(characters.slice(index, index + lineLength).join(''));
  }

  return lines;
}

export function filterStationStats(stationStats, {
  filter = 'all',
  query = ''
} = {}) {
  const stations = Array.isArray(stationStats) ? stationStats : [];
  const normalizedQuery = String(query || '').trim();

  return stations.filter(station => {
    const matchesQuery = !normalizedQuery || String(station?.name || '').includes(normalizedQuery);
    const grade = normalizeGrade(station?.grade);
    const matchesFilter =
      filter === 'priority'
        ? grade === 'S' || grade === 'A'
        : filter === 'low'
          ? toFiniteNumber(station?.rate) < 80
          : true;

    return matchesQuery && matchesFilter;
  });
}

export function calculateTrendDetailLeft({
  nodeLeft = 0,
  nodeWidth = 0,
  viewportLeft = 0,
  viewportWidth = 0,
  detailWidth = 268,
  padding = 16
} = {}) {
  const safePadding = Math.max(0, toFiniteNumber(padding));
  const safeDetailWidth = Math.max(0, toFiniteNumber(detailWidth));
  const desiredLeft = toFiniteNumber(nodeLeft)
    - toFiniteNumber(viewportLeft)
    + toFiniteNumber(nodeWidth) / 2
    - safeDetailWidth / 2;
  const maxLeft = Math.max(
    safePadding,
    toFiniteNumber(viewportWidth) - safeDetailWidth - safePadding
  );

  return Math.max(safePadding, Math.min(maxLeft, desiredLeft));
}

export function calculateTrendEdgeVelocity(pointerX, viewportWidth, {
  edgeRatio = 0.2,
  maxSpeed = 4.2
} = {}) {
  const width = Math.max(0, toFiniteNumber(viewportWidth));
  const ratio = Math.min(0.5, Math.max(0, toFiniteNumber(edgeRatio)));
  const speed = Math.max(0, toFiniteNumber(maxSpeed));
  const edgeWidth = width * ratio;
  if (edgeWidth <= 0) return 0;

  const x = toFiniteNumber(pointerX);
  if (x < edgeWidth) {
    return -speed * (1 - Math.max(0, x) / edgeWidth);
  }
  if (x > width - edgeWidth) {
    return speed * (1 - Math.max(0, width - x) / edgeWidth);
  }
  return 0;
}

export function calculateTrendScrollStep({
  scrollLeft = 0,
  scrollWidth = 0,
  clientWidth = 0,
  currentVelocity = 0,
  desiredVelocity = 0,
  easing = 0.18
} = {}) {
  const current = toFiniteNumber(currentVelocity);
  const desired = toFiniteNumber(desiredVelocity);
  const nextVelocity = current + (desired - current) * toFiniteNumber(easing);
  const maxScroll = Math.max(
    0,
    toFiniteNumber(scrollWidth) - toFiniteNumber(clientWidth)
  );
  const currentScroll = Math.max(0, Math.min(maxScroll, toFiniteNumber(scrollLeft)));
  const nextScroll = Math.max(0, Math.min(maxScroll, currentScroll + nextVelocity));
  const reachedBoundary = nextScroll === currentScroll
    && ((desired < 0 && currentScroll <= 0)
      || (desired > 0 && currentScroll >= maxScroll));

  return {
    velocity: reachedBoundary ? 0 : nextVelocity,
    scrollLeft: nextScroll,
    reachedBoundary
  };
}

export function calcHomeStats() {
  const stations = Array.isArray(state.stations) ? state.stations : [];
  let totalShops = 0, rented = 0, vacant = 0, renovating = 0;
  let totalArea = 0, rentedArea = 0;
  const gradeCount = { S: 0, A: 0, B: 0, C: 0 };
  const stationStats = [];

  stations.forEach((station, idx) => {
    const grade = normalizeGrade(station?.grade);
    gradeCount[grade] += 1;

    let sTotal = 0, sRented = 0, sVacant = 0, sRenovating = 0, sMultiSpot = 0;
    let sTotalArea = 0, sRentedArea = 0;

    (station.shops || []).forEach(shop => {
      if (shop.type === '多经点位') {
        sMultiSpot++;
        return;
      }
      const shopArea = toFiniteNumber(shop.area);
      totalShops++;
      sTotal++;
      totalArea += shopArea;
      sTotalArea += shopArea;

      if (shop.status === '营业中') {
        rented++;
        sRented++;
        rentedArea += shopArea;
        sRentedArea += shopArea;
      } else if (shop.status === '装修中') {
        renovating++;
        sRenovating++;
        rentedArea += shopArea;
        sRentedArea += shopArea;
      } else {
        vacant++;
        sVacant++;
      }
    });

    const rate = sTotal > 0 ? ((sRented + sRenovating) / sTotal * 100).toFixed(1) : '0.0';
    stationStats.push({
      ...station,
      grade,
      _origIdx: idx,
      shopCount: sTotal,
      multiSpot: sMultiSpot,
      rented: sRented,
      vacant: sVacant,
      renovating: sRenovating,
      rate: parseFloat(rate),
      rateStr: rate + '%',
      totalArea: sTotalArea.toFixed(1),
      rentedArea: sRentedArea.toFixed(1)
    });
  });

  const rentRate = totalShops > 0 ? ((rented + renovating) / totalShops * 100).toFixed(1) : '0.0';

  // 按原始序号排序（线路顺序）
  stationStats.sort((a, b) => a._origIdx - b._origIdx);

  // 用于排名的副本（按出租率排序）
  const rankedByRate = [...stationStats].sort((a, b) => b.rate - a.rate);

  return {
    stationCount: stations.length,
    totalShops,
    rented,
    vacant,
    renovating,
    rentRate: parseFloat(rentRate),
    rentRateStr: rentRate + '%',
    totalArea: totalArea.toFixed(1),
    rentedArea: rentedArea.toFixed(1),
    gradeCount,
    stationStats,
    topStations: rankedByRate.slice(0, 5),
    bottomStations: rankedByRate.slice(-5).reverse()
  };
}

// ============================================
// 渲染：经营总览与核心指标
// ============================================

function createDashboardKpis(stats) {
  const stationStats = Array.isArray(stats?.stationStats) ? stats.stationStats : [];
  const multiSpotCount = stationStats.reduce(
    (total, station) => total + toFiniteNumber(station?.multiSpot),
    0
  );

  return [
    {
      key: 'rentRate',
      label: '整体出租率',
      value: stats?.rentRateStr || '0.0%',
      note: '营业中及装修中点位 / 商业点位'
    },
    {
      key: 'totalShops',
      label: '商业点位',
      value: toFiniteNumber(stats?.totalShops),
      note: `${toFiniteNumber(stats?.stationCount)} 座车站 · 多经点位 ${multiSpotCount}`
    },
    {
      key: 'rented',
      label: '已出租',
      value: toFiniteNumber(stats?.rented),
      note: '当前状态为营业中'
    },
    {
      key: 'renovating',
      label: '装修中',
      value: toFiniteNumber(stats?.renovating),
      note: '装修点位单独统计'
    },
    {
      key: 'vacant',
      label: '空置点位',
      value: toFiniteNumber(stats?.vacant),
      note: '当前状态为未出租'
    }
  ];
}

function renderDashboardHero(container) {
  container.innerHTML = `
    <div class="dashboard-hero-content">
      <p class="dashboard-eyebrow">Line 11 Commercial Intelligence</p>
      <h1 id="dashboard-hero-title">经营总览</h1>
      <p class="dashboard-hero-description">汇集全线站点商业点位、出租状态与经营表现，为商业资产管理提供统一、清晰的实时视图。</p>
      <div class="dashboard-hero-actions" aria-label="相关业务页面">
        <a href="data-viz.html">管理商业信息</a>
        <a href="battle-map.html">查看线路资产</a>
      </div>
    </div>
  `;
}

function renderDashboardKpis(container, kpis) {
  container.innerHTML = kpis.map(kpi => `
    <article class="dashboard-kpi" data-kpi="${kpi.key}">
      <div class="dashboard-kpi-heading">
        <span class="dashboard-kpi-label">${kpi.label}</span>
        <span class="dashboard-kpi-mark" aria-hidden="true"></span>
      </div>
      <div class="dashboard-kpi-value">${escapeHtml(kpi.value)}</div>
      <p class="dashboard-kpi-note">${escapeHtml(kpi.note)}</p>
    </article>
  `).join('');
}

export function renderDashboardOverview(stats) {
  const hero = document.getElementById('dashboard-hero');
  const kpiContainer = document.getElementById('dashboard-kpis');
  if (!hero || !kpiContainer) return;

  renderDashboardHero(hero);
  renderDashboardKpis(kpiContainer, createDashboardKpis(stats));
}

export function renderDashboardEmptyStates(stats) {
  if (Array.isArray(stats?.stationStats) && stats.stationStats.length > 0) return;

  const trendMount = document.getElementById('trendChart')
    || document.getElementById('dashboard-trend');
  const stationContainer = document.getElementById('layer-stations');

  if (trendMount) {
    trendMount.innerHTML = '<div class="dashboard-empty-state">暂无站点商业趋势数据</div>';
  }
  if (stationContainer) {
    stationContainer.innerHTML = '<div class="dashboard-empty-state">暂无站点经营数据</div>';
  }
}

// ============================================
// 渲染：站点商业趋势
// ============================================

const TREND_SERIES = [
  { key: 'total', label: '商业点位', pointKey: 'totalY' },
  { key: 'rented', label: '已出租', pointKey: 'rentedY' },
  { key: 'vacant', label: '空置', pointKey: 'vacantY' }
];

function createTrendPath(points, pointKey, offsetX, offsetY) {
  return points.map((point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${command}${(point.x + offsetX).toFixed(2)},${(point[pointKey] + offsetY).toFixed(2)}`;
  }).join(' ');
}

function createTrendStationLabel(station, x, labelY) {
  const lines = formatStationNameLines(station?.name);
  return `
    <text class="trend-station-label" x="${x}" y="${labelY}" text-anchor="middle">
      ${lines.map((line, index) => (
        `<tspan x="${x}" dy="${index === 0 ? 0 : 15}">${escapeHtml(line)}</tspan>`
      )).join('')}
    </text>
  `;
}

function createTrendDetail(station, index, stationCount) {
  const gradeClass = getGradeClass(station?.grade, 'grade-');
  const shops = Array.isArray(station?.shops) ? station.shops : [];

  const shopRows = shops.map(shop => {
    const hasPhoto = shop.photo && shop.photo !== '';
    return `
      <div class="trend-shop-row">
        <div class="trend-shop-info">
          <span class="trend-shop-name">${escapeHtml(shop.name)}</span>
          <span class="trend-shop-meta">${escapeHtml(shop.type || '商铺')} · ${escapeHtml(shop.area)}㎡ · ${escapeHtml(shop.tenant || '—')}</span>
        </div>
        <div class="trend-shop-photo-wrap">
          ${hasPhoto ? `<img class="trend-shop-photo" src="${escapeAttr(shop.photo)}" alt="${escapeAttr(shop.name)}现场照片">` : `<span class="trend-shop-photo-placeholder"></span>`}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="trend-detail-head">
      <span class="trend-detail-grade${gradeClass ? ` ${gradeClass}` : ''}">${escapeHtml(station?.grade)}</span>
      <strong>${escapeHtml(station?.name)}</strong>
      ${station?.transfer ? '<span class="trend-detail-tag">换乘站</span>' : ''}
    </div>
    <div class="trend-detail-stats">
      <span><small>商业点位</small><b>${escapeHtml(toFiniteNumber(station?.shopCount))}</b></span>
      <span><small>已出租</small><b>${escapeHtml(toFiniteNumber(station?.rented))}</b></span>
      <span><small>装修</small><b>${escapeHtml(toFiniteNumber(station?.renovating))}</b></span>
      <span><small>空置</small><b>${escapeHtml(toFiniteNumber(station?.vacant))}</b></span>
    </div>
    <div class="trend-detail-foot">
      <span>出租率 ${escapeHtml(station?.rateStr || '0.0%')}</span>
      <span>第 ${index + 1} / ${stationCount} 站</span>
    </div>
    <div class="trend-detail-shops">
      <div class="trend-detail-shops-title">商铺明细（${shops.length}个）</div>
      ${shopRows}
    </div>
  `;
}

function updateTrendDetailPosition(left) {
  for (const styleSheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = styleSheet.cssRules;
    } catch {
      continue;
    }

    const detailRule = Array.from(rules || []).find(
      rule => rule.selectorText === '.trend-detail'
    );
    if (detailRule) {
      detailRule.style.setProperty('left', `${left}px`);
      return;
    }
  }
}

function bindTrendStationDetails(container, stations) {
  const viewport = container.querySelector('.trend-viewport');
  const guide = container.querySelector('.trend-guide');
  const detail = container.querySelector('.trend-detail');
  if (!viewport || !guide || !detail) return () => {};

  const cleanups = [];
  container.querySelectorAll('.trend-station-node').forEach(node => {
    const showStationDetail = () => {
      const index = Number(node.dataset.stationIndex);
      const station = stations[index];
      if (!station) return;

      const x = node.dataset.x;
      guide.setAttribute('x1', x);
      guide.setAttribute('x2', x);
      guide.classList.add('is-active');

      container.querySelectorAll('.trend-point.is-active').forEach(point => {
        point.classList.remove('is-active');
      });
      node.querySelectorAll('.trend-point').forEach(point => {
        point.classList.add('is-active');
      });

      detail.innerHTML = createTrendDetail(station, index, stations.length);
      detail.classList.add('is-active');
      detail.setAttribute('aria-hidden', 'false');

      const viewportRect = viewport.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const detailLeft = calculateTrendDetailLeft({
        nodeLeft: nodeRect.left,
        nodeWidth: nodeRect.width,
        viewportLeft: viewportRect.left,
        viewportWidth: viewport.clientWidth
      });
      updateTrendDetailPosition(detailLeft);
    };

    node.addEventListener('mouseenter', showStationDetail);
    node.addEventListener('pointerenter', showStationDetail);
    node.addEventListener('click', showStationDetail);
    node.addEventListener('focus', showStationDetail);
    cleanups.push(() => {
      node.removeEventListener('mouseenter', showStationDetail);
      node.removeEventListener('pointerenter', showStationDetail);
      node.removeEventListener('click', showStationDetail);
      node.removeEventListener('focus', showStationDetail);
    });
  });

  return () => cleanups.forEach(cleanup => cleanup());
}

function bindTrendEdgeScroll(container) {
  const viewport = container.querySelector('.trend-viewport');
  const precisePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!viewport || !precisePointer?.matches || reducedMotion?.matches) return () => {};

  const edgeRatio = 0.2;
  const maxSpeed = 4.2;
  const easing = 0.18;
  let desiredVelocity = 0;
  let currentVelocity = 0;
  let frameId = null;
  let isDisposed = false;

  const stopScrolling = () => {
    desiredVelocity = 0;
    currentVelocity = 0;
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  const animate = () => {
    if (isDisposed) return;
    frameId = null;
    const nextState = calculateTrendScrollStep({
      scrollLeft: viewport.scrollLeft,
      scrollWidth: viewport.scrollWidth,
      clientWidth: viewport.clientWidth,
      currentVelocity,
      desiredVelocity,
      easing
    });
    currentVelocity = nextState.velocity;
    viewport.scrollLeft = nextState.scrollLeft;
    if (nextState.reachedBoundary) {
      return;
    }

    if (desiredVelocity !== 0) {
      frameId = window.requestAnimationFrame(animate);
    }
  };

  const updateVelocity = event => {
    const rect = viewport.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const nextVelocity = calculateTrendEdgeVelocity(pointerX, rect.width, {
      edgeRatio,
      maxSpeed
    });

    if (nextVelocity === 0) {
      stopScrolling();
      return;
    }

    desiredVelocity = nextVelocity;
    if (frameId === null) {
      frameId = window.requestAnimationFrame(animate);
    }
  };

  viewport.addEventListener('mousemove', updateVelocity);
  viewport.addEventListener('mouseleave', stopScrolling);

  return () => {
    isDisposed = true;
    stopScrolling();
    viewport.removeEventListener('mousemove', updateVelocity);
    viewport.removeEventListener('mouseleave', stopScrolling);
  };
}

export function renderStationTrend(stationStats) {
  const container = document.getElementById('trendChart');
  const stations = Array.isArray(stationStats) ? stationStats : [];
  cleanupStationTrend?.();
  cleanupStationTrend = null;
  if (!container) return;
  if (stations.length === 0) {
    container.innerHTML = '<div class="dashboard-empty-state">暂无站点商业趋势数据</div>';
    return;
  }

  const chartTop = 24;
  const plotHeight = 210;
  const labelY = chartTop + plotHeight + 34;
  const chartHeight = 304;
  const sidePadding = 72;
  const stationSpacing = 88;
  const canvasWidth = Math.max(
    720,
    sidePadding * 2 + Math.max(1, stations.length - 1) * stationSpacing
  );
  const plotWidth = canvasWidth - sidePadding * 2;
  const maxShopCount = Math.max(0, ...stations.map(station => toFiniteNumber(station?.shopCount)));
  const ticks = createYAxisTicks(maxShopCount);
  const yMax = ticks.at(-1) || 1;
  const points = buildTrendPoints(stations, {
    plotWidth,
    plotHeight,
    yMax
  });
  const toTickY = value => chartTop + plotHeight - (value / yMax * plotHeight);

  const grid = ticks.map(value => {
    const y = toTickY(value).toFixed(2);
    return `
      <line class="trend-grid-line" x1="${sidePadding}" y1="${y}" x2="${canvasWidth - sidePadding}" y2="${y}"></line>
      <text class="trend-y-tick" data-value="${value}" x="${sidePadding - 16}" y="${y}" text-anchor="end" dominant-baseline="middle">${value}</text>
    `;
  }).join('');

  const paths = TREND_SERIES.map(series => `
    <path
      class="trend-series trend-series--${series.key}"
      data-series="${series.key}"
      d="${createTrendPath(points, series.pointKey, sidePadding, chartTop)}"
    ></path>
  `).join('');

  const stationNodes = stations.map((station, index) => {
    const point = points[index];
    const x = point.x + sidePadding;
    const stationLabel = [
      station?.name,
      `商业点位 ${toFiniteNumber(station?.shopCount)}`,
      `已出租 ${toFiniteNumber(station?.rented)}`,
      `空置 ${toFiniteNumber(station?.vacant)}`
    ].join('，');
    const pointCircles = TREND_SERIES.map(series => `
      <circle
        class="trend-point trend-point--${series.key}"
        cx="${x}"
        cy="${point[series.pointKey] + chartTop}"
        r="4"
        aria-hidden="true"
      ></circle>
    `).join('');

    return `
      <g
        class="trend-station-node"
        data-station-index="${index}"
        data-x="${x}"
        tabindex="0"
        role="button"
        aria-label="${escapeHtml(stationLabel)}"
      >
        <rect
          class="trend-station-hit-area"
          x="${x - stationSpacing / 2}"
          y="${chartTop}"
          width="${stationSpacing}"
          height="${chartHeight - chartTop}"
        ></rect>
        ${pointCircles}
        ${createTrendStationLabel(station, x, labelY)}
      </g>
    `;
  }).join('');

  container.innerHTML = `
    <div class="trend-legend" aria-label="趋势图图例">
      ${TREND_SERIES.map(series => `
        <span class="trend-legend-item trend-legend-item--${series.key}">
          <span aria-hidden="true"></span>${series.label}
        </span>
      `).join('')}
    </div>
    <div class="trend-viewport">
      <svg
        class="trend-chart"
        width="${canvasWidth}"
        height="${chartHeight}"
        viewBox="0 0 ${canvasWidth} ${chartHeight}"
        role="img"
        aria-label="全部站点商业点位、已出租与空置数量趋势"
      >
        <g class="trend-grid">${grid}</g>
        <g class="trend-paths">${paths}</g>
        <line
          class="trend-guide"
          x1="${sidePadding}"
          y1="${chartTop}"
          x2="${sidePadding}"
          y2="${chartTop + plotHeight}"
        ></line>
        <g class="trend-stations">${stationNodes}</g>
      </svg>
      <div class="trend-detail" aria-hidden="true"></div>
    </div>
  `;

  const cleanupDetails = bindTrendStationDetails(container, stations);
  const cleanupEdgeScroll = bindTrendEdgeScroll(container);
  cleanupStationTrend = () => {
    cleanupDetails();
    cleanupEdgeScroll();
  };
}

// ============================================
// 渲染：第二层 —— 站点总览表格
// ============================================

function renderStationTable(stationStats) {
  const container = document.getElementById('layer-stations');
  if (!container) return;

  const tbody = stationStats.map((s, idx) => {
    const shopsHtml = (s.shops || []).map(shop => {
      const statusClass = getShopStatusClass(shop.status);
      const typeClass = shop.type === '多经点位' ? ' shop-attribute--multi' : '';
      return `
        <tr class="shop-row">
          <td class="shop-no">${escapeHtml(shop.shortNo)}</td>
          <td class="shop-name">${escapeHtml(shop.name)}</td>
          <td class="shop-attribute-cell"><span class="shop-attribute${typeClass}">${escapeHtml(shop.type)}</span></td>
          <td class="shop-area">${escapeHtml(shop.area)}㎡</td>
          <td class="shop-tenant">${shop.tenant ? escapeHtml(shop.tenant) : '<span class="text-muted">—</span>'}</td>
          <td class="shop-status"><span class="status-dot ${statusClass}"></span>${escapeHtml(shop.status)}</td>
        </tr>
      `;
    }).join('');
    const gradeClass = getGradeClass(s.grade, 'grade-');
    const safeRate = clampPercentage(s.rate);

    return `
      <tr class="station-row" data-station-index="${idx}">
        <td class="station-name">
          <span class="station-sequence">${String(idx + 1).padStart(2, '0')}</span>
          <span class="station-name-copy">${escapeHtml(s.name)}</span>
          ${s.transfer ? '<span class="transfer-tag">换乘</span>' : ''}
        </td>
        <td class="station-grade">
          <span class="grade-badge${gradeClass ? ` ${gradeClass}` : ''}">${escapeHtml(s.grade)}</span>
        </td>
        <td class="station-count">${escapeHtml(s.shopCount)}</td>
        <td class="station-count">${escapeHtml(s.multiSpot)}</td>
        <td class="station-area">${escapeHtml(s.totalArea)}㎡</td>
        <td class="station-area">${escapeHtml(s.rentedArea)}㎡</td>
        <td class="station-status-summary" aria-label="已租 ${escapeHtml(s.rented)}，装修 ${escapeHtml(s.renovating)}，空置 ${escapeHtml(s.vacant)}">
          <span class="status-count status-count--rented">${escapeHtml(s.rented)}</span>
          <span class="status-separator">/</span>
          <span class="status-count status-count--renovating">${escapeHtml(s.renovating)}</span>
          <span class="status-separator">/</span>
          <span class="status-count status-count--vacant">${escapeHtml(s.vacant)}</span>
        </td>
        <td class="station-rate">
          <progress class="rate-bar" max="100" value="${safeRate}" aria-label="出租率 ${escapeHtml(s.rateStr)}"></progress>
          <span class="rate-text ${safeRate >= 80 ? 'rate-high' : safeRate >= 50 ? 'rate-mid' : 'rate-low'}">${escapeHtml(s.rateStr)}</span>
        </td>
        <td class="station-action">
          <button
            class="btn-expand"
            type="button"
            aria-label="展开 ${escapeHtml(s.name)} 商铺详情"
            aria-controls="station-detail-${idx}"
            aria-expanded="false"
          >
            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </td>
      </tr>
      <tr class="expand-row" id="station-detail-${idx}">
        <td colspan="9">
          <div class="expand-content">
            <div class="expand-header">
              <span class="expand-title">${escapeHtml(s.name)} — 商铺明细</span>
              <span class="expand-meta">总面积 ${escapeHtml(s.totalArea)}㎡ / 已租面积 ${escapeHtml(s.rentedArea)}㎡</span>
            </div>
            <table class="shop-table">
              <thead>
                <tr><th>编号</th><th>商铺名称</th><th>属性</th><th>面积</th><th>租户</th><th>状态</th></tr>
              </thead>
              <tbody>${shopsHtml}</tbody>
            </table>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="layer-header">
      <div>
        <div class="station-title-line">
          <h2 class="layer-title">站点经营概览</h2>
          <span class="station-count-badge">${stationStats.length} STATIONS</span>
        </div>
        <div class="layer-subtitle">按线路顺序展示全线商业经营数据，点击站点查看商铺明细</div>
      </div>
      <div class="station-table-tools" aria-label="站点经营概览筛选">
        <div class="station-filter-group" role="group" aria-label="站点筛选">
          <button class="station-filter is-active" type="button" data-station-filter="all" aria-pressed="true">全部站点</button>
          <button class="station-filter" type="button" data-station-filter="priority" aria-pressed="false">S / A 级</button>
          <button class="station-filter" type="button" data-station-filter="low" aria-pressed="false">低出租率</button>
        </div>
        <label class="station-search">
          <span class="station-search-icon" aria-hidden="true"></span>
          <input type="search" data-station-search placeholder="搜索站点" aria-label="搜索站点">
        </label>
      </div>
    </div>
    <div class="table-wrap station-table-scroll">
      <table class="station-table">
        <thead>
          <tr>
            <th>站点</th>
            <th>价值等级</th>
            <th>商铺</th>
            <th>多经点位</th>
            <th>总面积</th>
            <th>已租面积</th>
            <th>已租 / 装修 / 空置</th>
            <th>出租率</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${tbody}
          <tr class="station-empty-row" data-station-empty hidden>
            <td colspan="9">
              <div class="station-empty-state">
                <span class="station-empty-mark" aria-hidden="true"></span>
                <span>未找到符合条件的站点</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  let activeFilter = 'all';
  const filterButtons = Array.from(container.querySelectorAll('[data-station-filter]'));
  const searchInput = container.querySelector('[data-station-search]');
  const stationRows = Array.from(container.querySelectorAll('.station-row'));
  const emptyRow = container.querySelector('[data-station-empty]');
  const tableBody = container.querySelector('.station-table tbody');

  const setStationExpanded = (row, isExpanded) => {
    const detailRow = row?.nextElementSibling;
    if (!detailRow?.classList.contains('expand-row')) return;

    row.classList.toggle('expanded', isExpanded);
    detailRow.classList.toggle('expanded', isExpanded);
    row.querySelector('.btn-expand')?.setAttribute('aria-expanded', String(isExpanded));
  };

  const closeExpandedStations = () => {
    container.querySelectorAll('.expand-row.expanded').forEach(detailRow => {
      setStationExpanded(detailRow.previousElementSibling, false);
    });
  };

  const applyStationFilters = () => {
    const visibleStations = new Set(filterStationStats(stationStats, {
      filter: activeFilter,
      query: searchInput?.value
    }));

    stationRows.forEach((row, index) => {
      const isVisible = visibleStations.has(stationStats[index]);
      row.hidden = !isVisible;
      const detailRow = row.nextElementSibling;
      if (detailRow?.classList.contains('expand-row')) {
        detailRow.hidden = !isVisible;
        if (!isVisible) {
          setStationExpanded(row, false);
        }
      }
    });
    if (emptyRow) {
      emptyRow.hidden = visibleStations.size > 0;
    }
  };

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.stationFilter || 'all';
      filterButtons.forEach(item => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
      applyStationFilters();
    });
  });
  searchInput?.addEventListener('input', applyStationFilters);

  const toggleStationRow = row => {
    const detailRow = row.nextElementSibling;
    const isExpanded = detailRow.classList.contains('expanded');

    closeExpandedStations();
    if (isExpanded) return;

    setStationExpanded(row, true);
    setTimeout(() => {
      detailRow.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  tableBody?.addEventListener('click', event => {
    const row = event.target.closest('.station-row');
    if (row && !row.hidden) {
      toggleStationRow(row);
    }
  });

  tableBody?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const button = event.target.closest('.btn-expand');
    const row = button?.closest('.station-row');
    if (!row || row.hidden) return;

    event.preventDefault();
    toggleStationRow(row);
  });
}

function updateTooltipContent(station) {
  const gradeEl = document.getElementById('ttGrade');
  gradeEl.textContent = station.grade;
  const gradeClass = getGradeClass(station.grade, 'grade-');
  gradeEl.className = `tooltip-grade${gradeClass ? ` ${gradeClass}` : ''}`;
  document.getElementById('ttName').textContent = station.name + '站';
  document.getElementById('ttTransfer').classList.toggle('visible', !!station.transfer);

  // 统计数据
  document.getElementById('ttShops').textContent = station.shopCount;
  document.getElementById('ttMulti').textContent = station.multiSpot;
  document.getElementById('ttRate').textContent = station.rateStr;

  // 商铺列表
  const listEl = document.getElementById('ttShopList');
  const shops = (station.shops || []).filter(sh => sh.type !== '多经点位');
  const maxShow = 6;
  const showShops = shops.slice(0, maxShow);
  const moreCount = shops.length - maxShow;

  const shopHtml = showShops.map(shop => {
    const dotClass = getShopStatusClass(shop.status, '');
    const tenant = shop.tenant || '';
    return `
      <div class="tooltip-shop-item">
        <span class="tooltip-shop-dot ${dotClass}"></span>
        <span class="tooltip-shop-no">${escapeHtml(shop.name)}</span>
        <span class="tooltip-shop-tenant ${tenant ? '' : 'empty'}">${tenant ? escapeHtml(tenant) : '空置'}</span>
      </div>
    `;
  }).join('');

  const moreHtml = moreCount > 0 ? `<div class="tooltip-shop-more">+${moreCount} 更多商铺</div>` : '';
  listEl.innerHTML = shopHtml + moreHtml;
}

// ============================================
// 入场动画
// ============================================

function initEntranceAnimation() {
  const layers = document.querySelectorAll('.dashboard-section');
  if (typeof IntersectionObserver !== 'function') return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('layer-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  layers.forEach(layer => observer.observe(layer));
}

// ============================================
// 初始化
// ============================================

export async function initHome() {
  await loadData();
  calcGlobalStats();
  const stats = calcHomeStats();

  renderDashboardOverview(stats);
  if (stats.stationStats.length === 0) {
    renderDashboardEmptyStates(stats);
  } else {
    renderStationTrend(stats.stationStats);
    renderStationTable(stats.stationStats);
  }
  initEntranceAnimation();
}

// 导出内部函数供测试使用
export { renderStationTable, updateTooltipContent };
