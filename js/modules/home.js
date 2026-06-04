/**
 * 首页数据看板 —— 三层结构
 * 1. 综合数据概览  2. 站点总览（可展开）  3. 排名统计
 */

import { loadData, calcGlobalStats } from './data.js';
import { state } from './state.js';

// ============================================
// 数据计算
// ============================================

export function calcHomeStats() {
  const stations = state.stations;
  let totalShops = 0, rented = 0, vacant = 0, renovating = 0;
  let totalArea = 0, rentedArea = 0;
  const gradeCount = { S: 0, A: 0, B: 0, C: 0 };
  const stationStats = [];

  stations.forEach((station, idx) => {
    gradeCount[station.grade] = (gradeCount[station.grade] || 0) + 1;

    let sTotal = 0, sRented = 0, sVacant = 0, sRenovating = 0, sMultiSpot = 0;
    let sTotalArea = 0, sRentedArea = 0;

    (station.shops || []).forEach(shop => {
      if (shop.type === '多经点位') {
        sMultiSpot++;
        return;
      }
      totalShops++;
      sTotal++;
      totalArea += shop.area || 0;
      sTotalArea += shop.area || 0;

      if (shop.status === '营业中') {
        rented++;
        sRented++;
        rentedArea += shop.area || 0;
        sRentedArea += shop.area || 0;
      } else if (shop.status === '装修中') {
        renovating++;
        sRenovating++;
        rentedArea += shop.area || 0;
        sRentedArea += shop.area || 0;
      } else {
        vacant++;
        sVacant++;
      }
    });

    const rate = sTotal > 0 ? ((sRented + sRenovating) / sTotal * 100).toFixed(1) : '0.0';
    stationStats.push({
      ...station,
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
// 动画：数字递增
// ============================================

function animateValue(el, target, suffix = '', duration = 800) {
  const start = 0;
  const startTime = performance.now();
  const isFloat = String(target).includes('.');

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = isFloat
      ? (start + (parseFloat(target) - start) * eased).toFixed(1)
      : Math.floor(start + (target - start) * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ============================================
// 渲染：第一层 —— 综合数据概览（紧凑面板）
// ============================================

function renderOverview(stats) {
  const container = document.getElementById('layer-overview');
  if (!container) return;

  const rateWidth = stats.totalShops > 0 ? ((stats.rented + stats.renovating) / stats.totalShops * 100).toFixed(1) : 0;

  const gradeDots = Object.entries(stats.gradeCount).map(([g, count]) =>
    `<span class="grade-dot-item"><span class="grade-dot ${g}"></span>${g}级 ${count}站</span>`
  ).join('');

  container.innerHTML = `
    <div class="summary-panel">
      <div class="summary-header">
        <div class="summary-title">综合数据概览</div>
        <div class="summary-date">截至 ${state.globalStats.statsDate || '今日'}</div>
      </div>

      <div class="summary-core">
        <div class="core-rate">
          <div class="core-rate-value" data-target="${stats.rentRate}" data-suffix="%">0%</div>
          <div class="core-rate-bar-wrap">
            <div class="core-rate-bar" style="width:0%" data-width="${rateWidth}%"></div>
          </div>
          <div class="core-rate-label">整体出租率</div>
        </div>

        <div class="summary-divider"></div>

        <div class="core-metrics">
          <div class="core-metric">
            <div class="core-metric-value" data-target="${stats.stationCount}">0</div>
            <div class="core-metric-label">站点</div>
          </div>
          <div class="core-metric">
            <div class="core-metric-value" data-target="${stats.totalShops}">0</div>
            <div class="core-metric-label">商铺</div>
          </div>
          <div class="core-metric">
            <div class="core-metric-value rented" data-target="${stats.rented}">0</div>
            <div class="core-metric-label">已租</div>
          </div>
          <div class="core-metric">
            <div class="core-metric-value vacant" data-target="${stats.vacant}">0</div>
            <div class="core-metric-label">空置</div>
          </div>
          <div class="core-metric">
            <div class="core-metric-value renovating" data-target="${stats.renovating}">0</div>
            <div class="core-metric-label">装修</div>
          </div>
        </div>
      </div>

      <div class="summary-footer">
        <span class="summary-footer-label">商业价值分级：</span>
        <div class="grade-dots">${gradeDots}</div>
      </div>
    </div>
  `;

  // 数字动画
  container.querySelectorAll('[data-target]').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    animateValue(el, target, suffix, 1000);
  });

  // 进度条动画
  setTimeout(() => {
    const bar = container.querySelector('.core-rate-bar');
    if (bar) bar.style.width = bar.dataset.width;
  }, 100);
}

// ============================================
// 渲染：第二层 —— 站点总览表格
// ============================================

function renderStationTable(stationStats) {
  const container = document.getElementById('layer-stations');
  if (!container) return;

  const tbody = stationStats.map((s, idx) => {
    const shopsHtml = (s.shops || []).map(shop => {
      const statusClass = shop.status === '营业中' ? 'status-rented' : shop.status === '装修中' ? 'status-renovating' : 'status-vacant';
      const typeBadge = shop.type === '多经点位' ? '<span class="shop-type">多经</span>' : '';
      return `
        <tr class="shop-row">
          <td class="shop-no">${shop.shortNo}</td>
          <td class="shop-name">${shop.name}${typeBadge}</td>
          <td class="shop-area">${shop.area}㎡</td>
          <td class="shop-tenant">${shop.tenant || '<span class="text-muted">—</span>'}</td>
          <td class="shop-status"><span class="status-dot ${statusClass}"></span>${shop.status}</td>
        </tr>
      `;
    }).join('');

    return `
      <tr class="station-row" data-idx="${idx}">
        <td class="station-num">${String(idx + 1).padStart(2, '0')}</td>
        <td class="station-name">
          <span class="grade-badge grade-${s.grade}">${s.grade}</span>
          ${s.name}
          ${s.transfer ? '<span class="transfer-tag">换乘</span>' : ''}
        </td>
        <td class="station-count">${s.shopCount}</td>
        <td class="station-count">${s.multiSpot}</td>
        <td class="station-area">${s.totalArea}㎡</td>
        <td class="station-area">${s.rentedArea}㎡</td>
        <td class="station-rented">${s.rented}</td>
        <td class="station-count">${s.renovating}</td>
        <td class="station-vacant">${s.vacant}</td>
        <td class="station-rate">
          <div class="rate-bar-bg">
            <div class="rate-bar-fill" style="width:${s.rate}%"></div>
          </div>
          <span class="rate-text ${s.rate >= 80 ? 'rate-high' : s.rate >= 50 ? 'rate-mid' : 'rate-low'}">${s.rateStr}</span>
        </td>
        <td class="station-action">
          <button class="btn-expand" aria-label="展开详情">
            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </td>
      </tr>
      <tr class="expand-row">
        <td colspan="11">
          <div class="expand-content">
            <div class="expand-header">
              <span class="expand-title">${s.name} — 商铺明细</span>
              <span class="expand-meta">总面积 ${s.totalArea}㎡ / 已租面积 ${s.rentedArea}㎡</span>
            </div>
            <table class="shop-table">
              <thead>
                <tr><th>编号</th><th>商铺名称</th><th>面积</th><th>租户</th><th>状态</th></tr>
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
      <h2 class="layer-title">站点总览</h2>
      <div class="layer-subtitle">全部 ${stationStats.length} 个站点 · 按线路顺序排列 · 点击行展开商铺详情</div>
    </div>
    <div class="table-wrap">
      <table class="station-table">
        <thead>
          <tr>
            <th style="width:44px">序号</th>
            <th>站点名称</th>
            <th style="width:56px">商铺</th>
            <th style="width:56px">多经</th>
            <th style="width:72px">总面积</th>
            <th style="width:72px">已租面积</th>
            <th style="width:56px">已租</th>
            <th style="width:56px">装修</th>
            <th style="width:56px">空置</th>
            <th style="width:140px">出租率</th>
            <th style="width:48px"></th>
          </tr>
        </thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;

  // 绑定展开/收起事件
  container.querySelectorAll('.station-row').forEach(row => {
    row.addEventListener('click', () => {
      const expandRow = row.nextElementSibling;
      const isExpanded = expandRow.classList.contains('expanded');

      // 收起其他已展开的
      container.querySelectorAll('.expand-row.expanded').forEach(r => {
        r.classList.remove('expanded');
        r.previousElementSibling.classList.remove('expanded');
      });

      if (!isExpanded) {
        expandRow.classList.add('expanded');
        row.classList.add('expanded');
        setTimeout(() => {
          expandRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
  });
}

// ============================================
// 渲染：第二层 —— 线路站点速览
// ============================================

const STATION_WIDTH = 64; // 每个站点固定宽度

function renderLinePreview(stationStats) {
  const container = document.getElementById('lineContainer');
  if (!container) return;

  const tooltip = document.getElementById('stationTooltip');
  if (tooltip && tooltip.parentElement !== document.body) {
    document.body.appendChild(tooltip);
  }

  const scrollWrap = document.querySelector('.line-scroll-wrap');
  if (!scrollWrap) return;

  // 渲染站点
  stationStats.forEach((s, idx) => {
    const dotClass = s.rate >= 80 ? 'high' : s.rate >= 50 ? 'mid' : 'low';
    const isTransfer = s.transfer ? true : false;

    const stationEl = document.createElement('div');
    stationEl.className = 'line-station';
    stationEl.dataset.idx = idx;

    stationEl.innerHTML = `
      <div class="station-dot-wrap">
        <div class="station-dot ${dotClass} ${isTransfer ? 'transfer' : ''}"></div>
        ${isTransfer ? '<div class="station-dot-ring"></div>' : ''}
      </div>
      <div class="station-name-below" title="${s.name}">${s.name}</div>
    `;

    stationEl.addEventListener('mouseenter', (e) => showTooltip(e, s));
    container.appendChild(stationEl);
  });

  // 鼠标跟随滑动
  const lineContainer = container;
  let targetOffset = 0;
  let currentOffset = 0;
  let rafId = null;

  function smoothScroll() {
    const diff = targetOffset - currentOffset;
    if (Math.abs(diff) < 0.5) {
      currentOffset = targetOffset;
      lineContainer.style.transform = `translateX(-${currentOffset}px)`;
      rafId = null;
      return;
    }
    currentOffset += diff * 0.18;
    lineContainer.style.transform = `translateX(-${currentOffset}px)`;
    rafId = requestAnimationFrame(smoothScroll);
  }

  scrollWrap.addEventListener('mousemove', (e) => {
    const rect = scrollWrap.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const maxOffset = Math.max(0, lineContainer.scrollWidth - rect.width);
    targetOffset = ratio * maxOffset;
    if (!rafId) rafId = requestAnimationFrame(smoothScroll);
  });

  scrollWrap.addEventListener('mouseleave', () => {
    hideTooltip();
  });

  window.addEventListener('scroll', hideTooltip, { passive: true });
}

function updateTooltipContent(station) {
  const gradeEl = document.getElementById('ttGrade');
  gradeEl.textContent = station.grade;
  gradeEl.className = 'tooltip-grade grade-' + station.grade;
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
    const dotClass = shop.status === '营业中' ? 'rented' : shop.status === '装修中' ? 'renovating' : 'vacant';
    const tenant = shop.tenant || '';
    return `
      <div class="tooltip-shop-item">
        <span class="tooltip-shop-dot ${dotClass}"></span>
        <span class="tooltip-shop-no">${shop.name}</span>
        <span class="tooltip-shop-tenant ${tenant ? '' : 'empty'}">${tenant || '空置'}</span>
      </div>
    `;
  }).join('');

  const moreHtml = moreCount > 0 ? `<div class="tooltip-shop-more">+${moreCount} 更多商铺</div>` : '';
  listEl.innerHTML = shopHtml + moreHtml;
}

function showTooltip(e, station) {
  const tooltip = document.getElementById('stationTooltip');
  if (!tooltip) return;

  const targetEl = e.currentTarget;
  const dot = targetEl.querySelector('.station-dot');
  if (!dot) return;

  // 更新内容
  updateTooltipContent(station);

  // 强制重排确保尺寸正确
  void tooltip.offsetHeight;

  // 获取尺寸和位置
  const ttRect = tooltip.getBoundingClientRect();
  const dotRect = dot.getBoundingClientRect();

  let left = dotRect.left + dotRect.width / 2 - ttRect.width / 2;
  let top = dotRect.top - ttRect.height - 14;

  const pad = 12;
  if (left < pad) left = pad;
  if (left + ttRect.width > window.innerWidth - pad) left = window.innerWidth - ttRect.width - pad;
  if (top < pad) top = dotRect.bottom + 14;

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.opacity = '1';

  // 箭头
  const arrow = tooltip.querySelector('.tooltip-arrow');
  const arrowCenter = dotRect.left + dotRect.width / 2 - left;
  arrow.style.left = (arrowCenter - 6) + 'px';
  if (top > dotRect.top) {
    arrow.style.bottom = 'auto';
    arrow.style.top = '-6px';
    arrow.style.transform = 'rotate(225deg)';
  } else {
    arrow.style.bottom = '-6px';
    arrow.style.top = 'auto';
    arrow.style.transform = 'rotate(45deg)';
  }
}

function hideTooltip() {
  const tooltip = document.getElementById('stationTooltip');
  if (tooltip) tooltip.style.opacity = '0';
}

// ============================================
// 渲染：第三层 —— 排名统计
// ============================================

function renderRankings(stats) {
  const container = document.getElementById('layer-rankings');
  if (!container) return;

  const topHtml = stats.topStations.map((s, i) => `
    <div class="rank-item" style="animation-delay:${i * 60}ms">
      <span class="rank-num rank-top">${i + 1}</span>
      <span class="rank-name">${s.name}</span>
      <span class="rank-grade grade-${s.grade}">${s.grade}</span>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${s.rate}%"></div></div>
      <span class="rank-rate ${s.rate >= 80 ? 'rate-high' : 'rate-mid'}">${s.rateStr}</span>
    </div>
  `).join('');

  const bottomHtml = stats.bottomStations.map((s, i) => `
    <div class="rank-item" style="animation-delay:${i * 60}ms">
      <span class="rank-num rank-bottom">${stats.stationStats.length - i}</span>
      <span class="rank-name">${s.name}</span>
      <span class="rank-grade grade-${s.grade}">${s.grade}</span>
      <div class="rank-bar-wrap"><div class="rank-bar rank-bar-low" style="width:${s.rate}%"></div></div>
      <span class="rank-rate rate-low">${s.rateStr}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="layer-header">
      <h2 class="layer-title">排名统计</h2>
      <div class="layer-subtitle">出租率排名对比</div>
    </div>
    <div class="rankings-grid">
      <div class="rank-panel">
        <div class="rank-panel-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
          出租率 TOP 5
        </div>
        <div class="rank-list">${topHtml}</div>
      </div>
      <div class="rank-panel">
        <div class="rank-panel-title rank-panel-title--bottom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          出租率 BOTTOM 5
        </div>
        <div class="rank-list">${bottomHtml}</div>
      </div>
    </div>
  `;
}

// ============================================
// 入场动画
// ============================================

function initEntranceAnimation() {
  const layers = document.querySelectorAll('.home-layer');
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

  renderOverview(stats);
  renderLinePreview(stats.stationStats);
  renderStationTable(stats.stationStats);
  renderRankings(stats);
  initEntranceAnimation();
}
