/**
 * 渲染引擎 — SVG、卡片、面板、图例
 */

import { state } from './state.js';
import { config, escapeHtml, resolveCardOverlaps, enforceLineBoundaries, calcRate } from './utils.js';

// 主渲染函数
export function renderAll() {
  renderStatsPanel();
  renderSVG();
  renderStations();
  renderGradePanel();
  renderFooter();
}

// 渲染统计面板
export function renderStatsPanel() {
  const empty6 = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
  const total = (state.globalStats.totalShops === '' || state.globalStats.totalShops === undefined || state.globalStats.totalShops === null) ? empty6 : state.globalStats.totalShops;
  const rented = (state.globalStats.rentedShops === '' || state.globalStats.rentedShops === undefined || state.globalStats.rentedShops === null) ? empty6 : state.globalStats.rentedShops;
  const vacant = (state.globalStats.vacantShops === '' || state.globalStats.vacantShops === undefined || state.globalStats.vacantShops === null) ? empty6 : state.globalStats.vacantShops;
  const rate = calcRate(state.globalStats.totalShops, state.globalStats.rentedShops) || empty6;

  const statsGrid = document.querySelector('.stats-grid');
  if (!statsGrid) return;
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">🏪</div>
      <div class="stat-info">
        <div class="stat-label">全线商铺总数</div>
        <div class="stat-value"><span class="num-red">${total}</span> <span class="unit">间</span></div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-info">
        <div class="stat-label">已出租</div>
        <div class="stat-value"><span class="num-green">${rented}</span> <span class="unit">间</span></div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📈</div>
      <div class="stat-info">
        <div class="stat-label">出租率</div>
        <div class="stat-value"><span class="num-orange">${rate}</span><span class="unit">%</span></div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🏠</div>
      <div class="stat-info">
        <div class="stat-label">空置</div>
        <div class="stat-value"><span class="editable-num num-blue" data-field="vacantShops">${vacant}</span> <span class="unit">间</span></div>
      </div>
    </div>
  `;
}

// 渲染 SVG 线路
export function renderSVG() {
  const svg = document.getElementById('metroLines');
  if (!svg) return;

  const defs = `
    <defs>
      <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0)" />
        <stop offset="50%" style="stop-color:rgba(255,220,150,0.9)" />
        <stop offset="100%" style="stop-color:rgba(255,255,255,0)" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  `;

  const lineHorizontal1 = `M 80,480 L 1700,480`;
  const lineVertical = `L 1700,780`;
  const lineSlant1 = `L 1920,820`;
  const lineSlant2 = `L 2040,840`;
  const lineHorizontal2 = `L 2380,840`;
  const fullLinePath = `${lineHorizontal1} ${lineVertical} ${lineSlant1} ${lineSlant2} ${lineHorizontal2}`;
  const shanghaiLine = `M 2380,840 L 2460,840`;

  let svgContent = defs;
  svgContent += `<path d="${fullLinePath}" class="metro-line" stroke="#8b1538" stroke-width="12" opacity="0.25" />`;
  svgContent += `<path d="${fullLinePath}" class="metro-line main-line" />`;
  svgContent += `<path d="${shanghaiLine}" class="metro-line" stroke="#1890ff" stroke-width="5" />`;
  svgContent += `<path d="${fullLinePath}" class="metro-line flow-anim" />`;

  state.stations.forEach(s => {
    if (s.transfer) {
      svgContent += `<circle cx="${s.x}" cy="${s.y}" r="10" fill="#c41e3a" stroke="white" stroke-width="2" />`;
      svgContent += `<circle cx="${s.x}" cy="${s.y}" r="5" fill="white" />`;
    } else {
      svgContent += `<circle cx="${s.x}" cy="${s.y}" r="6" fill="white" stroke="#c41e3a" stroke-width="2.5" />`;
    }

    const labelY = s.pos === 'top' ? s.y - 22 : s.y + 18;
    svgContent += `<text x="${s.x}" y="${labelY}" class="station-label-svg">${s.name.replace('站', '')}</text>`;

    if (s.transfer && s.transferLine) {
      const tagY = s.pos === 'top' ? s.y + 26 : s.y - 18;
      const tagX = s.x;
      const lineColor = '#1890ff';
      svgContent += `<rect x="${tagX - 28}" y="${tagY - 8}" width="56" height="16" rx="3" fill="white" stroke="${lineColor}" stroke-width="1.5" />`;
      svgContent += `<text x="${tagX}" y="${tagY + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="${lineColor}">${s.transferLine}</text>`;
    }
  });

  svgContent += `<polygon points="2460,835 2475,840 2460,845" fill="#1890ff" />`;
  svgContent += `<text x="2482" y="844" font-size="11" font-weight="700" fill="#1890ff">上海11号线</text>`;

  svg.innerHTML = svgContent;
}

// 渲染站点卡片
export function renderStations() {
  const layer = document.getElementById('stationsLayer');
  if (!layer) return;
  layer.innerHTML = '';

  // 1. 计算所有卡片的初始位置和尺寸
  const cardInfos = state.stations.map((s, idx) => {
    const cardW = 160;
    const lineH = 22;
    const headerH = 35;
    const padding = 20;
    const maxShops = Math.max(4, (s.shops || []).length);
    const cardH = headerH + maxShops * lineH + padding;

    let left, top;
    if (s.pos === 'top') {
      left = s.x - cardW / 2;
      top = s.y - cardH - 45;
    } else if (s.pos === 'bottom') {
      left = s.x - cardW / 2;
      top = s.y + 45;
    } else if (s.pos === 'right') {
      left = s.x + 35;
      top = s.y - cardH / 2;
    } else if (s.pos === 'left') {
      left = s.x - cardW - 35;
      top = s.y - cardH / 2;
    } else if (s.pos === 'bottom-right') {
      left = s.x - cardW / 2;
      top = s.y + 45;
    }

    return {
      idx, id: s.id, station: s,
      left, top, width: cardW, height: cardH,
      origLeft: left, origTop: top, pos: s.pos,
      x: s.x, y: s.y
    };
  });

  // 2. 动态避让
  resolveCardOverlaps(cardInfos);

  // 3. 线路边界保护
  enforceLineBoundaries(cardInfos);

  // 4. 使用避让后的位置渲染卡片
  cardInfos.forEach(info => {
    const s = info.station;
    const card = document.createElement('div');
    card.className = `station-card card-${s.pos}`;
    card.dataset.id = s.id;
    card.dataset.idx = info.idx;
    card.style.left = info.left + 'px';
    card.style.top = info.top + 'px';
    card.style.width = info.width + 'px';
    card.style.height = info.height + 'px';

    const statusColor = {
      '营业中': '#34c759',
      '装修中': '#ff9500',
      '未出租': '#ff3b30'
    };
    const shopsHtml = (s.shops || []).map((shop, si) => {
      const displayName = (shop.name || shop.no + '号商铺').replace(/[（(].*?[)）]/g, '');
      return `
      <div class="card-shop-row" data-idx="${info.idx}" data-si="${si}">
        <span class="shop-status-dot" style="background:${statusColor[shop.status] || '#86868b'};" title="${escapeHtml(shop.status || '')}"></span>
        <span class="shop-name" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</span>
        <span class="shop-tenant" title="${escapeHtml(shop.tenant || '')}">${escapeHtml(shop.tenant || '')}</span>
      </div>
    `;
    }).join('');

    const validShops = (s.shops || []).filter(sh => sh.type !== '多经点位');
    const totalValid = validShops.length;
    const rentedValid = validShops.filter(sh => sh.status !== '未出租').length;
    const rate = totalValid > 0 ? Math.round((rentedValid / totalValid) * 100) : 0;

    let barColor;
    if (rate === 0) barColor = '#ff3b30';
    else if (rate < 60) barColor = '#ff9500';
    else barColor = '#34c759';

    card.innerHTML = `
      <div class="card-grade-bar" style="background:${barColor};" data-rate="${rate}%"></div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(s.name)}</div>
        ${shopsHtml}
      </div>
    `;

    layer.appendChild(card);
  });

  // 5. 绘制卡片到站点的连接线
  const svg = document.getElementById('metroLines');
  if (svg) {
    svg.querySelectorAll('.connector-group').forEach(el => el.remove());
    const connectorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connectorGroup.setAttribute('class', 'connector-group');
    cardInfos.forEach(info => {
      const s = info.station;
      let endX, endY;
      if (s.pos === 'top') {
        endX = info.left + info.width / 2;
        endY = info.top + info.height;
      } else if (s.pos === 'bottom') {
        endX = info.left + info.width / 2;
        endY = info.top;
      } else if (s.pos === 'right') {
        endX = info.left;
        endY = info.top + info.height / 2;
      } else if (s.pos === 'left') {
        endX = info.left + info.width;
        endY = info.top + info.height / 2;
      } else {
        endX = info.left + info.width / 2;
        endY = info.top;
      }
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', s.x);
      line.setAttribute('y1', s.y);
      line.setAttribute('x2', endX);
      line.setAttribute('y2', endY);
      line.setAttribute('class', 'connector-line');
      connectorGroup.appendChild(line);
    });
    svg.appendChild(connectorGroup);
  }
}

// 渲染商业价值分级面板
export function renderGradePanel() {
  const list = document.getElementById('gradeList');
  if (!list) return;
  const showText = (text) => (text && text.trim() !== '') ? text : '      ';
  list.innerHTML = Object.entries(state.gradeInfo).map(([key, info]) => `
    <div class="grade-item grade-${key.toLowerCase()}">
      <div class="grade-badge">${key}</div>
      <div class="grade-text">
        <div class="grade-name editable-grade" data-grade="${key}" data-field="name" data-raw="${info.name}">${showText(info.name)}</div>
        <div class="grade-stations editable-grade" data-grade="${key}" data-field="desc" data-raw="${info.desc}">${showText(info.desc)}</div>
      </div>
    </div>
  `).join('');
}

// 渲染底部
export function renderFooter() {
  const dateEl = document.querySelector('.footer .editable');
  if (dateEl) dateEl.textContent = state.globalStats.statsDate;
}
