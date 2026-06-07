/**
 * 数据可视化模块 — 商业数据页面逻辑
 * 负责卡片网格渲染、筛选排序、站点编辑，复用 data.js 和 state.js
 */

import { state } from './state.js';
import { loadData, saveData } from './data.js';

// ============================================
// 常量
// ============================================

/** 商业等级配置 */
export const GRADE_CONFIG = {
  S: { color: '#d4380d', label: 'S级' },
  A: { color: '#fa8c16', label: 'A级' },
  B: { color: '#facc14', label: 'B级' },
  C: { color: '#52c41a', label: 'C级' }
};

/** 商铺状态到 CSS 类名的映射 */
const STATUS_MAP = {
  '营业中': { dot: 'status-rented', badge: 'rented', label: '已租' },
  '未出租': { dot: 'status-vacant', badge: 'vacant', label: '空置' },
  '装修中': { dot: 'status-renovating', badge: 'renovating', label: '装修' }
};

// ============================================
// 数据计算
// ============================================

/**
 * 计算单个站点的统计数据
 * @param {Object} station 站点对象
 * @returns {{ total: number, rented: number, vacant: number, renovating: number, rate: number, multiCount: number, area: number }}
 */
export function calcStationStats(station) {
  const shops = station.shops || [];
  const shopList = shops.filter(s => s.type !== '多经点位');
  const multiList = shops.filter(s => s.type === '多经点位');
  const total = shopList.length;
  const rented = shopList.filter(s => s.status === '营业中').length;
  const vacant = shopList.filter(s => s.status === '未出租').length;
  const renovating = shopList.filter(s => s.status === '装修中').length;
  const rate = total > 0 ? Math.round((rented / total) * 100) : 0;
  return {
    total,
    rented,
    vacant,
    renovating,
    rate,
    multiCount: multiList.length,
    area: shopList.reduce((sum, s) => sum + (s.area || 0), 0)
  };
}

// ============================================
// 筛选与排序（纯函数）
// ============================================

/**
 * 按等级筛选站点
 * @param {Array} stations 站点数组
 * @param {string} grade 等级筛选值（'all' / 'S' / 'A' / 'B' / 'C'）
 * @returns {Array} 筛选后的站点数组（新数组，不改变原数组）
 */
export function filterStations(stations, grade) {
  if (grade === 'all' || !grade) return [...stations];
  return stations.filter(s => s.grade === grade);
}

/**
 * 按指定方式排序站点
 * @param {Array} stations 站点数组
 * @param {string} sortBy 排序方式（'default' / 'rate-desc' / 'rate-asc' / 'shops-desc'）
 * @returns {Array} 排序后的站点数组（新数组，不改变原数组）
 */
export function sortStations(stations, sortBy) {
  const arr = [...stations];
  switch (sortBy) {
    case 'rate-desc':
      arr.sort((a, b) => calcStationStats(b).rate - calcStationStats(a).rate);
      break;
    case 'rate-asc':
      arr.sort((a, b) => calcStationStats(a).rate - calcStationStats(b).rate);
      break;
    case 'shops-desc':
      arr.sort((a, b) => calcStationStats(b).total - calcStationStats(a).total);
      break;
    default:
      // 默认按 x 坐标排序（地铁线路从西到东）
      arr.sort((a, b) => (a.x || 0) - (b.x || 0));
  }
  return arr;
}

// ============================================
// 状态样式映射
// ============================================

/**
 * 获取商铺状态的 CSS 类名映射
 * @param {string} status 商铺状态（'营业中' / '未出租' / '装修中'）
 * @returns {{ dot: string, badge: string, label: string }}
 */
export function getStatusStyle(status) {
  return STATUS_MAP[status] || { dot: 'status-default', badge: '', label: status };
}

// ============================================
// 渲染函数（DOM 操作）
// ============================================

/**
 * 渲染整个卡片网格
 * @param {Array} stations 站点数组
 * @param {string|null} expandedId 当前展开的卡片 ID
 * @param {string} currentFilter 当前筛选值
 * @param {string} currentSort 当前排序方式
 */
export function renderCards(stations, expandedId, currentFilter, currentSort) {
  const grid = document.getElementById('cardsGrid');
  if (!grid) return;

  // 筛选
  let filtered = filterStations(stations, currentFilter);
  // 排序
  filtered = sortStations(filtered, currentSort);

  if (!stations.length) {
    grid.innerHTML = '<div class="empty-state">暂无数据</div>';
    return;
  }

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state">该等级下暂无站点</div>';
    return;
  }

  grid.innerHTML = filtered.map((station, i) => renderCard(station, i, expandedId)).join('');

  // 进度条入场动画
  requestAnimationFrame(() => {
    grid.querySelectorAll('.rate-fill').forEach((bar, i) => {
      const target = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = target; }, i * 20);
    });
  });
}

/**
 * 渲染单张站点概览卡片
 * @param {Object} station 站点对象
 * @param {number} idx 站点在数组中的索引
 * @param {string|null} expandedId 当前展开的卡片 ID
 * @returns {string} 卡片 HTML 字符串
 */
export function renderCard(station, idx, expandedId) {
  const stats = calcStationStats(station);
  const grade = station.grade || 'C';
  const gc = GRADE_CONFIG[grade] || GRADE_CONFIG.C;
  const rateClass = stats.rate >= 70 ? 'high' : stats.rate >= 40 ? 'mid' : 'low';
  const isExpanded = expandedId === station.id;
  const shops = station.shops || [];
  const shopList = shops.filter(s => s.type !== '多经点位');
  const previewShops = shopList.slice(0, 3);
  const hasMore = shopList.length > 3;

  return `
    <div class="card station-card ${isExpanded ? 'expanded' : ''}" data-id="${station.id}" data-grade="${grade}" data-rate="${stats.rate}" data-shops="${stats.total}">
      <div class="card-header">
        <div class="card-grade grade-${grade.toLowerCase()}" style="background:${gc.color};">${grade}</div>
        <div class="card-name">${station.name}</div>
        ${station.transfer ? '<span class="card-transfer">换乘</span>' : ''}
        <div class="card-actions">
          <button class="icon-btn" data-action="edit" title="编辑站点">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>
      <div class="card-overview">
        <div class="rate-big">${stats.rate}<span class="unit">%</span></div>
        <div class="overview-stats">
          <div class="overview-stat"><div class="val">${stats.total}</div><div class="lbl">总商铺</div></div>
          <div class="overview-stat"><div class="val green">${stats.rented}</div><div class="lbl">已出租</div></div>
          <div class="overview-stat"><div class="val red">${stats.vacant}</div><div class="lbl">空置</div></div>
          <div class="overview-stat"><div class="val">${stats.area.toFixed(1)}</div><div class="lbl">总面积(㎡)</div></div>
        </div>
      </div>
      <div class="rate-bar-wrap">
        <div class="rate-bar"><div class="rate-fill ${rateClass}" style="width:${stats.rate}%"></div></div>
      </div>
      ${previewShops.length > 0 ? `
      <div class="shop-preview">
        ${previewShops.map(s => {
          const st = getStatusStyle(s.status);
          return `<div class="preview-row">
            <span class="status-dot ${st.dot}"></span>
            <span class="shop-name">${s.name}</span>
            <span class="shop-tenant">${s.tenant || '—'}</span>
          </div>`;
        }).join('')}
      </div>` : ''}
      ${hasMore ? `<div class="preview-more">+ ${shopList.length - 3} 个商铺</div>` : ''}
      <button class="expand-btn" data-action="expand">
        <span>${isExpanded ? '收起详情' : `查看全部 ${shopList.length} 个商铺`}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      ${isExpanded ? renderDetail(station, idx) : ''}
    </div>
  `;
}

/**
 * 渲染站点详情区域（编辑表单 + 商铺表格）
 * @param {Object} station 站点对象
 * @param {number} idx 站点索引
 * @returns {string} 详情 HTML 字符串
 */
function renderDetail(station, idx) {
  const shops = station.shops || [];
  return `
    <div class="card-detail">
      <div class="detail-section">
        <div class="detail-title">站点信息</div>
        <div class="info-grid">
          <div class="info-field">
            <label>站点名称</label>
            <input type="text" data-field="name" value="${station.name || ''}" placeholder="输入站点名称">
          </div>
          <div class="info-field">
            <label>商业价值等级</label>
            <select data-field="grade">
              <option value="S" ${station.grade === 'S' ? 'selected' : ''}>S级（核心商圈/换乘）</option>
              <option value="A" ${station.grade === 'A' ? 'selected' : ''}>A级（重点发展站）</option>
              <option value="B" ${station.grade === 'B' ? 'selected' : ''}>B级（潜力提升站）</option>
              <option value="C" ${station.grade === 'C' ? 'selected' : ''}>C级（培育优化站）</option>
            </select>
          </div>
          <div class="info-field">
            <label>换乘站</label>
            <select data-field="transfer">
              <option value="false" ${!station.transfer ? 'selected' : ''}>否</option>
              <option value="true" ${station.transfer ? 'selected' : ''}>是</option>
            </select>
          </div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-title">商铺列表（${shops.length}个）</div>
        <div style="overflow-x:auto;">
          <table class="shop-table">
            <thead>
              <tr>
                <th class="col-status"></th>
                <th class="col-no">序号</th>
                <th class="col-name">铺号</th>
                <th class="col-type">属性</th>
                <th class="col-area">面积(㎡)</th>
                <th class="col-tenant">商户</th>
                <th class="col-status">状态</th>
                <th class="col-action"></th>
              </tr>
            </thead>
            <tbody data-shop-list>
              ${shops.map((shop, sIdx) => {
                const st = getStatusStyle(shop.status);
                return `<tr data-shop-idx="${sIdx}">
                  <td class="col-status"><span class="status-dot ${st.dot}"></span></td>
                  <td class="col-no">${shop.no || sIdx + 1}</td>
                  <td class="col-name"><input type="text" data-shop-field="name" value="${shop.name || ''}"></td>
                  <td class="col-type">
                    <select data-shop-field="type">
                      <option value="商铺" ${shop.type === '商铺' ? 'selected' : ''}>商铺</option>
                      <option value="多经点位" ${shop.type === '多经点位' ? 'selected' : ''}>多经点位</option>
                    </select>
                  </td>
                  <td class="col-area"><input type="number" step="0.01" data-shop-field="area" value="${shop.area || 0}"></td>
                  <td class="col-tenant"><input type="text" data-shop-field="tenant" value="${shop.tenant || ''}"></td>
                  <td class="col-status">
                    <select data-shop-field="status">
                      <option value="营业中" ${shop.status === '营业中' ? 'selected' : ''}>营业中</option>
                      <option value="未出租" ${shop.status === '未出租' ? 'selected' : ''}>未出租</option>
                      <option value="装修中" ${shop.status === '装修中' ? 'selected' : ''}>装修中</option>
                    </select>
                  </td>
                  <td class="col-action">
                    <button class="delete-btn" data-shop-delete title="删除">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <button class="add-shop-btn" data-add-shop>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          添加商铺
        </button>
      </div>
      <div class="detail-actions">
        <button class="btn btn-ghost" data-action="cancel">取消</button>
        <button class="btn btn-primary" data-action="save">保存修改</button>
      </div>
    </div>
  `;
}

// ============================================
// 交互状态（模块级，页面生命周期内有效）
// ============================================

let currentFilter = 'all';
let currentSort = 'default';
let expandedId = null;
let onRenderCallback = null; // 图表更新回调

// ============================================
// Toast 提示
// ============================================

/**
 * 显示页面底部的 toast 提示
 * @param {string} msg 提示文字
 */
export function showToast(msg) {
  const toast = document.getElementById('saveToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ============================================
// 工具栏事件绑定
// ============================================

/**
 * 绑定筛选和排序工具栏按钮的点击事件
 */
export function bindToolbar() {
  // 等级筛选
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      expandedId = null;
      renderGrid();
    });
  });

  // 排序
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-sort]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      expandedId = null;
      renderGrid();
    });
  });
}

// ============================================
// 卡片交互事件绑定
// ============================================

/**
 * 为卡片网格中的所有交互元素绑定事件（事件委托）
 */
export function bindCardEvents() {
  const grid = document.getElementById('cardsGrid');
  if (!grid) return;

  // 展开/收起
  grid.querySelectorAll('[data-action="expand"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.station-card');
      const id = card.dataset.id;
      expandedId = expandedId === id ? null : id;
      renderGrid();
      if (expandedId) {
        setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    });
  });

  // 编辑按钮
  grid.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.station-card');
      const id = card.dataset.id;
      expandedId = expandedId === id ? null : id;
      renderGrid();
      if (expandedId) {
        setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    });
  });

  // 保存
  grid.querySelectorAll('[data-action="save"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.station-card');
      saveCard(card);
    });
  });

  // 取消
  grid.querySelectorAll('[data-action="cancel"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      expandedId = null;
      renderGrid();
    });
  });

  // 删除商铺
  grid.querySelectorAll('[data-shop-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = btn.closest('tr');
      const card = btn.closest('.station-card');
      const station = state.stations.find(s => s.id === card.dataset.id);
      if (!station) return;
      const sIdx = parseInt(row.dataset.shopIdx);
      if (confirm(`确定删除「${station.shops[sIdx]?.name || '该商铺'}」？`)) {
        station.shops.splice(sIdx, 1);
        expandedId = station.id;
        renderGrid();
      }
    });
  });

  // 添加商铺
  grid.querySelectorAll('[data-add-shop]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.station-card');
      const station = state.stations.find(s => s.id === card.dataset.id);
      if (!station) return;
      const newShop = {
        no: (station.shops?.length || 0) + 1,
        shortNo: '待定',
        name: '新商铺',
        type: '商铺',
        area: 0,
        tenant: '',
        contact: '',
        openDate: '',
        status: '未出租',
        remark: ''
      };
      station.shops = station.shops || [];
      station.shops.push(newShop);
      expandedId = station.id;
      renderGrid();
    });
  });
}

// ============================================
// 保存与渲染入口
// ============================================

/**
 * 保存单张展开卡片中的编辑内容
 * @param {HTMLElement} card 卡片 DOM 元素
 */
function saveCard(card) {
  const station = state.stations.find(s => s.id === card.dataset.id);
  if (!station) return;

  // 读取站点信息字段
  card.querySelectorAll('[data-field]').forEach(input => {
    const field = input.dataset.field;
    if (field === 'transfer') {
      station[field] = input.value === 'true';
    } else {
      station[field] = input.value;
    }
  });

  // 读取商铺信息字段
  const rows = card.querySelectorAll('[data-shop-idx]');
  rows.forEach(row => {
    const sIdx = parseInt(row.dataset.shopIdx);
    if (!station.shops[sIdx]) return;
    row.querySelectorAll('[data-shop-field]').forEach(input => {
      const field = input.dataset.shopField;
      if (field === 'area') {
        station.shops[sIdx][field] = parseFloat(input.value) || 0;
      } else {
        station.shops[sIdx][field] = input.value;
      }
    });
  });

  // 保存到后端
  saveData().then(result => {
    const source = result.source === 'server' ? '服务器' : '本地';
    showToast(`✅ 数据已保存到${source}`);
  });

  expandedId = station.id;
  renderGrid();
}

/**
 * 重新渲染整个网格（筛选 + 排序 + 渲染 + 事件绑定 + 图表回调）
 */
function renderGrid() {
  renderCards(state.stations, expandedId, currentFilter, currentSort);
  bindCardEvents();
  // 通知图表更新
  if (onRenderCallback) {
    const filtered = filterStations(state.stations, currentFilter);
    const sorted = sortStations(filtered, currentSort);
    onRenderCallback(sorted);
  }
}

// ============================================
// 初始化
// ============================================

/**
 * 初始化数据可视化页面
 * @param {Object} [options] 可选配置
 * @param {Function} [options.onRender] 每次重新渲染后的回调，接收当前显示的站点数组
 */
export async function initViz(options = {}) {
  if (options.onRender) {
    onRenderCallback = options.onRender;
  }

  // 用 data.js 的 loadData 从 API / localStorage / 默认数据加载
  await loadData();

  // 初始渲染
  renderGrid();
  bindToolbar();
}
