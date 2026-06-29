/**
 * 数据可视化模块测试 —— js/modules/viz.js
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state } from '../js/modules/state.js';

// 注意：viz.js 还不存在，测试先写后实现（Red → Green → Refactor）
// 以下 import 当前会失败，这正是 Red 阶段的目的

describe('数据可视化模块', () => {
  // ============================================
  describe('calcStationStats', () => {
    it('应该正确计算站点商铺统计数据（正向）', async () => {
      const { calcStationStats } = await import('../js/modules/viz.js');
      const station = {
        shops: [
          { type: '商铺', area: 20, status: '营业中' },
          { type: '商铺', area: 15, status: '未出租' },
          { type: '商铺', area: 10, status: '装修中' },
          { type: '多经点位', area: 5, status: '营业中' }
        ]
      };
      const stats = calcStationStats(station);
      expect(stats.total).toBe(3);    // 多经点位不计入
      expect(stats.rented).toBe(1);   // 仅营业中
      expect(stats.vacant).toBe(1);   // 未出租
      expect(stats.renovating).toBe(1); // 装修中
      expect(stats.multiCount).toBe(1);
      expect(stats.area).toBe(45);    // 20+15+10，不含多经点位
      expect(stats.rate).toBe(33);    // Math.round(1/3*100) = 33
    });

    it('空商铺数组应该返回全零统计', async () => {
      const { calcStationStats } = await import('../js/modules/viz.js');
      const station = { shops: [] };
      const stats = calcStationStats(station);
      expect(stats.total).toBe(0);
      expect(stats.rented).toBe(0);
      expect(stats.vacant).toBe(0);
      expect(stats.rate).toBe(0);
      expect(stats.area).toBe(0);
    });

    it('shops 为 undefined 时不应报错', async () => {
      const { calcStationStats } = await import('../js/modules/viz.js');
      const station = {};
      const stats = calcStationStats(station);
      expect(stats.total).toBe(0);
      expect(stats.rented).toBe(0);
      expect(stats.rate).toBe(0);
    });

    it('全部商铺为多经点位时应返回零统计', async () => {
      const { calcStationStats } = await import('../js/modules/viz.js');
      const station = {
        shops: [
          { type: '多经点位', area: 10, status: '营业中' },
          { type: '多经点位', area: 15, status: '未出租' }
        ]
      };
      const stats = calcStationStats(station);
      expect(stats.total).toBe(0);
      expect(stats.multiCount).toBe(2);
      expect(stats.area).toBe(0); // 多经点位面积不计入
    });

    it('出租率 100% 时应返回 100', async () => {
      const { calcStationStats } = await import('../js/modules/viz.js');
      const station = {
        shops: [
          { type: '商铺', area: 20, status: '营业中' },
          { type: '商铺', area: 15, status: '营业中' }
        ]
      };
      const stats = calcStationStats(station);
      expect(stats.rented).toBe(2);
      expect(stats.vacant).toBe(0);
      expect(stats.rate).toBe(100);
    });

    it('出租率 0% 时应返回 0', async () => {
      const { calcStationStats } = await import('../js/modules/viz.js');
      const station = {
        shops: [
          { type: '商铺', area: 20, status: '未出租' }
        ]
      };
      const stats = calcStationStats(station);
      expect(stats.rented).toBe(0);
      expect(stats.rate).toBe(0);
    });
  });

  // ============================================
  // filterStations — 等级筛选
  // ============================================
  describe('filterStations', () => {
    const stations = [
      { id: 's1', grade: 'S', name: 'S站' },
      { id: 'a1', grade: 'A', name: 'A站1' },
      { id: 'a2', grade: 'A', name: 'A站2' },
      { id: 'b1', grade: 'B', name: 'B站' },
      { id: 'c1', grade: 'C', name: 'C站' }
    ];

    it('筛选 "A" 级应仅返回 A 级站点', async () => {
      const { filterStations } = await import('../js/modules/viz.js');
      const result = filterStations(stations, 'A');
      expect(result).toHaveLength(2);
      expect(result.every(s => s.grade === 'A')).toBe(true);
    });

    it('应该按规范化后的当前等级筛选站点', async () => {
      const { filterStations } = await import('../js/modules/viz.js');
      const result = filterStations([
        { id: 'a1', grade: 'a' },
        { id: 'b1', grade: 'B' },
        { id: 'bad', grade: 'X' }
      ], 'A');
      expect(result.map(station => station.id)).toEqual(['a1']);
      expect(filterStations([{ id: 'bad', grade: 'X' }], 'C').map(station => station.id))
        .toEqual(['bad']);
    });

    it('筛选 "all" 应返回全部站点', async () => {
      const { filterStations } = await import('../js/modules/viz.js');
      const result = filterStations(stations, 'all');
      expect(result).toHaveLength(5);
    });

    it('筛选无匹配等级应返回空数组', async () => {
      const { filterStations } = await import('../js/modules/viz.js');
      const result = filterStations(stations, 'X');
      expect(result).toHaveLength(0);
    });

    it('空站点数组筛选应返回空数组', async () => {
      const { filterStations } = await import('../js/modules/viz.js');
      const result = filterStations([], 'A');
      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // sortStations — 排序
  // ============================================
  describe('sortStations', () => {
    // 构造带商铺数据的站点用于排序测试
    function makeStation(id, grade, x, shops) {
      return { id, grade, x, shops: shops || [] };
    }

    // 辅助：给站点附加 calcStationStats 所需的数据
    const highRate = makeStation('high', 'A', 100, [
      { type: '商铺', area: 10, status: '营业中' },
      { type: '商铺', area: 10, status: '营业中' },
      { type: '商铺', area: 10, status: '未出租' }
    ]); // 2 rented, 3 total, rate=67

    const midRate = makeStation('mid', 'A', 200, [
      { type: '商铺', area: 10, status: '营业中' },
      { type: '商铺', area: 10, status: '未出租' }
    ]); // 1 rented, 2 total, rate=50

    const lowRate = makeStation('low', 'A', 300, [
      { type: '商铺', area: 10, status: '未出租' }
    ]); // 0 rented, 1 total, rate=0

    const stations = [midRate, lowRate, highRate]; // 刻意乱序

    it('按出租率降序排列（rate-desc）', async () => {
      const { sortStations } = await import('../js/modules/viz.js');
      const sorted = sortStations([...stations], 'rate-desc');
      // high(67) > mid(50) > low(0)
      expect(sorted[0].id).toBe('high');
      expect(sorted[1].id).toBe('mid');
      expect(sorted[2].id).toBe('low');
    });

    it('按出租率升序排列（rate-asc）', async () => {
      const { sortStations } = await import('../js/modules/viz.js');
      const sorted = sortStations([...stations], 'rate-asc');
      // low(0) < mid(50) < high(67)
      expect(sorted[0].id).toBe('low');
      expect(sorted[1].id).toBe('mid');
      expect(sorted[2].id).toBe('high');
    });

    it('按商铺数降序排列（shops-desc）', async () => {
      const { sortStations } = await import('../js/modules/viz.js');
      const sorted = sortStations([...stations], 'shops-desc');
      // high(3 shops) > mid(2 shops) > low(1 shop)
      expect(sorted[0].id).toBe('high');
      expect(sorted[1].id).toBe('mid');
      expect(sorted[2].id).toBe('low');
    });

    it('默认排序按 x 坐标升序', async () => {
      const { sortStations } = await import('../js/modules/viz.js');
      const sorted = sortStations([...stations], 'default');
      expect(sorted[0].x).toBe(100);
      expect(sorted[1].x).toBe(200);
      expect(sorted[2].x).toBe(300);
    });

    it('未知排序方式应回退到默认排序', async () => {
      const { sortStations } = await import('../js/modules/viz.js');
      const sorted = sortStations([...stations], 'unknown');
      // 应按 x 坐标升序（默认行为）
      expect(sorted[0].x).toBeLessThanOrEqual(sorted[1].x);
      expect(sorted[1].x).toBeLessThanOrEqual(sorted[2].x);
    });
  });

  // ============================================
  // getStatusStyle — 状态样式映射
  // ============================================
  describe('getStatusStyle', () => {
    it('营业中应返回对应样式', async () => {
      const { getStatusStyle } = await import('../js/modules/viz.js');
      const style = getStatusStyle('营业中');
      expect(style.dot).toBe('status-rented');
      expect(style.badge).toBe('rented');
    });

    it('未出租应返回对应样式', async () => {
      const { getStatusStyle } = await import('../js/modules/viz.js');
      const style = getStatusStyle('未出租');
      expect(style.dot).toBe('status-vacant');
      expect(style.badge).toBe('vacant');
    });

    it('装修中应返回对应样式', async () => {
      const { getStatusStyle } = await import('../js/modules/viz.js');
      const style = getStatusStyle('装修中');
      expect(style.dot).toBe('status-renovating');
      expect(style.badge).toBe('renovating');
    });

    it('未知状态应返回默认样式', async () => {
      const { getStatusStyle } = await import('../js/modules/viz.js');
      const style = getStatusStyle('未知状态');
      expect(style.dot).toBe('status-default');
    });
  });

  // ============================================
  // renderCards — 卡片网格渲染
  // ============================================
  describe('renderCards', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="cardsGrid"></div>';
    });

    it('应该为每个站点渲染一张卡片', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      const stations = [
        { id: 's1', name: '测试站1', grade: 'A', shops: [], transfer: false },
        { id: 's2', name: '测试站2', grade: 'B', shops: [], transfer: false }
      ];
      renderCards(stations, null, 'all', 'default');
      const grid = document.getElementById('cardsGrid');
      const cards = grid.querySelectorAll('.station-card');
      expect(cards.length).toBe(2);
    });

    it('换乘站卡片应包含换乘标签', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      const stations = [
        { id: 't1', name: '换乘站', grade: 'S', shops: [], transfer: true }
      ];
      renderCards(stations, null, 'all', 'default');
      const cardTransfer = document.querySelector('.card-transfer');
      expect(cardTransfer).not.toBeNull();
      expect(cardTransfer.textContent).toBe('换乘');
    });

    it('空站点数组应显示空态提示', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      renderCards([], null, 'all', 'default');
      const grid = document.getElementById('cardsGrid');
      expect(grid.textContent).toContain('暂无数据');
    });

    it('筛选后无匹配站点应显示空态提示', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      const stations = [
        { id: 'a1', name: 'A站', grade: 'A', shops: [], transfer: false }
      ];
      // 筛选 B 级，但只有 A 级站点
      renderCards(stations, null, 'B', 'default');
      const grid = document.getElementById('cardsGrid');
      expect(grid.textContent).toContain('暂无站点');
    });

    it('所有卡片应包含等级徽章和站点名称', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      const stations = [
        { id: 's1', name: '唯亭站', grade: 'c', shops: [], transfer: false }
      ];
      renderCards(stations, null, 'all', 'default');
      const card = document.querySelector('.station-card');
      expect(card.querySelector('.card-grade').textContent).toBe('C');
      expect(card.dataset.grade).toBe('C');
      expect(card.querySelector('.card-grade').classList.contains('grade-c')).toBe(true);
      expect(card.querySelector('.card-name').textContent).toBe('唯亭站');
    });

    it('展开卡片应包含详情区域', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      const stations = [
        { id: 's1', name: '测试站', grade: 'A', shops: [], transfer: false }
      ];
      renderCards(stations, 's1', 'all', 'default');
      const card = document.querySelector('.station-card');
      expect(card.classList.contains('expanded')).toBe(true);
      expect(card.querySelector('.card-detail')).not.toBeNull();
    });
  });

  // ============================================
  // 照片管理 — 商铺表格照片列与操作按钮
  // ============================================
  describe('商铺照片管理', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="cardsGrid"></div><div id="saveToast"></div>';
    });

    it('展开的商铺表格应包含现场照片列', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      const stations = [{
        id: 's1', name: '测试站', grade: 'A', shops: [
          { no: 1, name: '商铺1', type: '商铺', area: 10, tenant: '', status: '未出租', photo: '' }
        ], transfer: false, x: 100, y: 480, pos: 'top'
      }];
      renderCards(stations, 's1', 'all', 'default');
      const ths = document.querySelectorAll('.shop-table th');
      const headerTexts = Array.from(ths).map(th => th.textContent.trim());
      expect(headerTexts).toContain('现场照片');
    });

    it('有照片的商铺行应显示替换照片和删除照片按钮', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      const stations = [{
        id: 's1', name: '测试站', grade: 'A', shops: [
          { no: 1, name: '商铺1', type: '商铺', area: 10, tenant: '', status: '营业中', photo: 'data:image/jpeg;base64,/9j/4AAQ==' }
        ], transfer: false, x: 100, y: 480, pos: 'top'
      }];
      renderCards(stations, 's1', 'all', 'default');
      const photoCells = document.querySelectorAll('.col-photo');
      // 第二个 .col-photo 是数据行（跳过表头）
      const dataCell = photoCells[1];
      expect(dataCell).not.toBeNull();
      const replaceBtn = dataCell.querySelector('[data-photo-action="replace"]');
      const deleteBtn = dataCell.querySelector('[data-photo-action="delete"]');
      expect(replaceBtn).not.toBeNull();
      expect(deleteBtn).not.toBeNull();
    });

    it('无照片的商铺行应显示导入照片按钮', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      const stations = [{
        id: 's1', name: '测试站', grade: 'A', shops: [
          { no: 1, name: '商铺1', type: '商铺', area: 10, tenant: '', status: '未出租', photo: '' }
        ], transfer: false, x: 100, y: 480, pos: 'top'
      }];
      renderCards(stations, 's1', 'all', 'default');
      const photoCells = document.querySelectorAll('.col-photo');
      const dataCell = photoCells[1];
      const importBtn = dataCell.querySelector('[data-photo-action="import"]');
      expect(importBtn).not.toBeNull();
    });

    it('新增商铺应包含 photo 默认空字符串', async () => {
      const { renderCards, bindCardEvents } = await import('../js/modules/viz.js');
      state.stations = [{
        id: 's1', name: '测试站', grade: 'A', shops: [], transfer: false, x: 100, y: 480, pos: 'top'
      }];
      // 先渲染展开
      renderCards(state.stations, 's1', 'all', 'default');
      bindCardEvents();
      const card = document.querySelector('.station-card');
      const addBtn = card.querySelector('[data-add-shop]');
      addBtn.click();
      expect(state.stations[0].shops[0]).toHaveProperty('photo');
      expect(state.stations[0].shops[0].photo).toBe('');
    });
  });

  // ============================================
  // 照片悬停预览
  // ============================================
  describe('商铺照片悬停预览', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="cardsGrid"></div><div id="saveToast"></div>';
    });

    it('有照片的商铺预览项应包含照片预览标记', async () => {
      const { renderCards } = await import('../js/modules/viz.js');
      const stations = [{
        id: 's1', name: '测试站', grade: 'A', shops: [
          { no: 1, name: '商铺1', type: '商铺', area: 10, tenant: '商户A', status: '营业中', photo: 'data:image/jpeg;base64,/9j/4AAQ==' },
          { no: 2, name: '商铺2', type: '商铺', area: 15, tenant: '', status: '未出租', photo: '' }
        ], transfer: false, x: 100, y: 480, pos: 'top'
      }];
      renderCards(stations, null, 'all', 'default');
      const previewRows = document.querySelectorAll('.preview-row');
      // 有照片的预览项应有 data-photo 属性
      const hasPhotoRow = previewRows[0];
      expect(hasPhotoRow.dataset.photo).toBeTruthy();
    });

    it('悬停有照片的商铺行应显示预览浮层', async () => {
      const { renderCards, bindCardEvents } = await import('../js/modules/viz.js');
      state.stations = [{
        id: 's1', name: '测试站', grade: 'A', shops: [
          { no: 1, name: '商铺1', type: '商铺', area: 10, tenant: '', status: '营业中', photo: 'data:image/jpeg;base64,/9j/4AAQ==' }
        ], transfer: false, x: 100, y: 480, pos: 'top'
      }];
      renderCards(state.stations, 's1', 'all', 'default');
      bindCardEvents();
      const photoCells = document.querySelectorAll('.col-photo');
      const dataCell = photoCells[1];
      // Simulate cell at left side of viewport so popup goes to the right
      Object.defineProperty(dataCell, 'getBoundingClientRect', { value: () => ({ left: 100, right: 220, top: 200, bottom: 248, width: 120, height: 48 }) });
      dataCell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      const preview = document.getElementById('photoPreviewPopup');
      expect(preview).not.toBeNull();
      expect(preview.querySelector('img')).not.toBeNull();
      expect(preview.querySelector('img').src).toBe('data:image/jpeg;base64,/9j/4AAQ==');
    });

    it('悬停无照片的商铺行不应显示图片浮层', async () => {
      const { renderCards, bindCardEvents } = await import('../js/modules/viz.js');
      state.stations = [{
        id: 's1', name: '测试站', grade: 'A', shops: [
          { no: 1, name: '商铺1', type: '商铺', area: 10, tenant: '', status: '未出租', photo: '' }
        ], transfer: false, x: 100, y: 480, pos: 'top'
      }];
      renderCards(state.stations, 's1', 'all', 'default');
      bindCardEvents();
      const photoCells = document.querySelectorAll('.col-photo');
      const dataCell = photoCells[1];
      const popup = document.getElementById('photoPreviewPopup');
      const prevDisplay = popup ? popup.style.display : '';
      dataCell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      // 无照片时 popup 仍存在但不显示内容
      const preview = document.getElementById('photoPreviewPopup');
      expect(preview.querySelector('img')).toBeNull();
    });

    it('预览浮层应包含商铺名称作为上下文', async () => {
      const { renderCards, bindCardEvents } = await import('../js/modules/viz.js');
      state.stations = [{
        id: 's1', name: '测试站', grade: 'A', shops: [
          { no: 1, name: '有照片的商铺', type: '商铺', area: 10, tenant: '', status: '营业中', photo: 'data:image/jpeg;base64,/9j/4AAQ==' }
        ], transfer: false, x: 100, y: 480, pos: 'top'
      }];
      renderCards(state.stations, 's1', 'all', 'default');
      bindCardEvents();
      const photoCells = document.querySelectorAll('.col-photo');
      const dataCell = photoCells[1];
      Object.defineProperty(dataCell, 'getBoundingClientRect', { value: () => ({ left: 100, right: 220, top: 200, bottom: 248, width: 120, height: 48 }) });
      dataCell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      const preview = document.getElementById('photoPreviewPopup');
      expect(preview).not.toBeNull();
      expect(preview.textContent).toContain('有照片的商铺');
    });
  });

  describe('XSS 防护', () => {
    it('renderCard 应该转义站点名称中的脚本标签', async () => {
      const { renderCard } = await import('../js/modules/viz.js');
      const station = {
        id: 'xss1',
        name: '<img src=x onerror=alert(1)>',
        grade: 'A',
        shops: [
          { type: '商铺', name: '<script>alert(1)</script>', tenant: '<script>alert(1)</script>', status: '未出租' }
        ],
        transfer: false
      };
      const html = renderCard(station, 0, null);
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
    });

    it('renderCard 应该转义 input value 属性中的恶意内容', async () => {
      const { renderCard } = await import('../js/modules/viz.js');
      const station = {
        id: 'xss2',
        name: '测试站',
        grade: 'A',
        shops: [
          { no: 1, name: '<script>alert(1)</script>', type: '商铺', area: 20, tenant: '<script>alert(1)</script>', status: '未出租' }
        ],
        transfer: false
      };
      const html = renderCard(station, 0, 'xss2');
      // input value 中的脚本标签应该被转义
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html).not.toContain('value="<script>');
    });
  });

  describe('站点价值等级管理模块', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="cardsGrid"></div><section id="gradeManager"></section><div id="saveToast"></div>';
      state.stations = [
        { id: 'weiting', name: '唯亭站', grade: 'B', x: 10, shops: [], transfer: false },
        { id: 'huaqiao', name: '花桥站', grade: 'S', x: 20, shops: [], transfer: true },
        { id: 'bad', name: '待校验站', grade: 'X', x: 30, shops: [], transfer: false }
      ];
    });

    it('等级分布概览应该从当前 state.stations 派生', async () => {
      const { renderGradeManager } = await import('../js/modules/viz.js');

      renderGradeManager(state.stations);

      const counts = Object.fromEntries(
        Array.from(document.querySelectorAll('[data-grade-summary]')).map(item => [
          item.dataset.gradeSummary,
          item.querySelector('.grade-summary-count').textContent.trim()
        ])
      );
      expect(counts).toEqual({ S: '1', A: '0', B: '1', C: '1' });
    });

    it('等级调整应该先暂存且不立即修改 state.stations', async () => {
      const { renderGradeManager, setGradeDraft } = await import('../js/modules/viz.js');
      renderGradeManager(state.stations);

      setGradeDraft('weiting', 'A');

      expect(state.stations.find(station => station.id === 'weiting').grade).toBe('B');
      expect(document.querySelector('[data-grade-pending-count]').textContent).toContain('1');
      expect(document.querySelector('[data-grade-row][data-station-id="weiting"] .grade-current').textContent)
        .toContain('A');
    });

    it('保存等级调整后应该更新 state.stations 并调用保存函数', async () => {
      const persist = vi.fn(() => Promise.resolve({ success: true, source: 'local' }));
      const { renderGradeManager, setGradeDraft, saveGradeDrafts } = await import('../js/modules/viz.js');
      renderGradeManager(state.stations);
      setGradeDraft('weiting', 'A');

      await saveGradeDrafts(persist);

      expect(state.stations.find(station => station.id === 'weiting').grade).toBe('A');
      expect(persist).toHaveBeenCalledTimes(1);
      expect(document.querySelector('[data-grade-pending-count]').textContent).toContain('0');
    });

    it('撤销未保存等级调整应该恢复界面选择且不修改 state', async () => {
      const { renderGradeManager, setGradeDraft, discardGradeDrafts } = await import('../js/modules/viz.js');
      renderGradeManager(state.stations);
      setGradeDraft('weiting', 'A');

      discardGradeDrafts();

      expect(state.stations.find(station => station.id === 'weiting').grade).toBe('B');
      expect(document.querySelector('[data-grade-pending-count]').textContent).toContain('0');
      expect(document.querySelector('[data-grade-row][data-station-id="weiting"] .grade-current').textContent)
        .toContain('B');
    });

    it('定位到站点卡片不应该改变等级', async () => {
      const card = document.createElement('article');
      card.className = 'station-card';
      card.dataset.id = 'weiting';
      card.scrollIntoView = vi.fn();
      document.getElementById('cardsGrid').appendChild(card);
      const { renderGradeManager } = await import('../js/modules/viz.js');
      renderGradeManager(state.stations);

      document.querySelector('[data-grade-action="locate-card"][data-station-id="weiting"]').click();

      expect(card.scrollIntoView).toHaveBeenCalled();
      expect(card.classList.contains('is-grade-located')).toBe(true);
      expect(state.stations.find(station => station.id === 'weiting').grade).toBe('B');
    });
  });
});
