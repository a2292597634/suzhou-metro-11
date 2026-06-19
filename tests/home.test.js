/**
 * 首页数据看板测试 —— js/modules/home.js
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../js/modules/state.js';
import {
  buildTrendPoints,
  calculateTrendDetailLeft,
  calculateTrendEdgeVelocity,
  calculateTrendScrollStep,
  calcHomeStats,
  createYAxisTicks,
  filterStationStats,
  formatStationNameLines,
  initHome,
  renderStationTable,
  updateTooltipContent
} from '../js/modules/home.js';

describe('首页数据看板', () => {
  beforeEach(() => {
    state.stations = [];
    state.globalStats = {};
    document.body.innerHTML = '';
  });

  describe('calcHomeStats', () => {
    it('应该正确计算站点统计', () => {
      state.stations = [
        {
          name: '测试站1', grade: 'A', transfer: false,
          shops: [
            { type: '商铺', area: 20, status: '营业中' },
            { type: '商铺', area: 15, status: '未出租' },
            { type: '多经点位', area: 10, status: '营业中' }
          ]
        },
        {
          name: '测试站2', grade: 'B', transfer: false,
          shops: [
            { type: '商铺', area: 30, status: '装修中' },
            { type: '商铺', area: 25, status: '营业中' }
          ]
        }
      ];

      const stats = calcHomeStats();

      expect(stats.stationCount).toBe(2);
      expect(stats.totalShops).toBe(4);
      expect(stats.rented).toBe(2);
      expect(stats.vacant).toBe(1);
      expect(stats.renovating).toBe(1);
    });

    it('应该正确计算出租率', () => {
      state.stations = [
        {
          name: '测试站', grade: 'A',
          shops: [
            { type: '商铺', area: 20, status: '营业中' },
            { type: '商铺', area: 20, status: '未出租' }
          ]
        }
      ];

      const stats = calcHomeStats();

      expect(stats.rentRate).toBe(50.0);
      expect(stats.rentRateStr).toBe('50.0%');
    });

    it('应该正确统计各级站点数量', () => {
      state.stations = [
        { name: 'S1', grade: 'S', shops: [] },
        { name: 'S2', grade: 'S', shops: [] },
        { name: 'A1', grade: 'A', shops: [] },
        { name: 'B1', grade: 'B', shops: [] },
        { name: 'C1', grade: 'C', shops: [] }
      ];

      const stats = calcHomeStats();

      expect(stats.gradeCount.S).toBe(2);
      expect(stats.gradeCount.A).toBe(1);
      expect(stats.gradeCount.B).toBe(1);
      expect(stats.gradeCount.C).toBe(1);
    });

    it('应该用规范化后的当前等级统计站点数量', () => {
      state.stations = [
        { name: '小写S', grade: 's', shops: [] },
        { name: '非法等级', grade: 'X', shops: [] }
      ];

      const stats = calcHomeStats();

      expect(stats.gradeCount).toEqual({ S: 1, A: 0, B: 0, C: 1 });
      expect(stats.stationStats.map(station => station.grade)).toEqual(['S', 'C']);
    });

    it('空数据应该返回 0', () => {
      state.stations = [];

      const stats = calcHomeStats();

      expect(stats.stationCount).toBe(0);
      expect(stats.totalShops).toBe(0);
      expect(stats.rentRate).toBe(0);
    });

    it('应该生成 TOP5 和 BOTTOM5 排名', () => {
      state.stations = [
        { name: 'A', grade: 'S', shops: [{ type: '商铺', status: '营业中' }, { type: '商铺', status: '营业中' }] },
        { name: 'B', grade: 'A', shops: [{ type: '商铺', status: '营业中' }, { type: '商铺', status: '未出租' }] },
        { name: 'C', grade: 'B', shops: [{ type: '商铺', status: '未出租' }, { type: '商铺', status: '未出租' }] }
      ];

      const stats = calcHomeStats();

      expect(stats.topStations.length).toBe(3);
      expect(stats.topStations[0].name).toBe('A');
      expect(stats.topStations[2].name).toBe('C');
    });

    it('应该排除多经点位并将装修计入出租率和已租面积', () => {
      state.stations = [{
        name: '口径测试站',
        grade: 'A',
        shops: [
          { type: '商铺', area: 10, status: '营业中' },
          { type: '商铺', area: 20, status: '营业中' },
          { type: '商铺', area: 40, status: '装修中' },
          { type: '商铺', area: 30, status: '未出租' },
          { type: '多经点位', area: 99, status: '营业中' }
        ]
      }];

      const stats = calcHomeStats();
      const station = stats.stationStats[0];

      expect(stats.totalShops).toBe(4);
      expect(stats.rented).toBe(2);
      expect(stats.renovating).toBe(1);
      expect(stats.vacant).toBe(1);
      expect(stats.rentRateStr).toBe('75.0%');
      expect(stats.totalArea).toBe('100.0');
      expect(stats.rentedArea).toBe('70.0');
      expect(station.multiSpot).toBe(1);
      expect(station.shopCount).toBe(4);
      expect(station.rateStr).toBe('75.0%');
    });

    it('站点数据不是数组时应该返回安全的空统计', () => {
      state.stations = null;

      const stats = calcHomeStats();

      expect(stats.stationCount).toBe(0);
      expect(stats.stationStats).toEqual([]);
      expect(stats.totalArea).toBe('0.0');
      expect(stats.rentedArea).toBe('0.0');
      expect(stats.rentRateStr).toBe('0.0%');
    });
  });

  describe('首页趋势与筛选纯函数', () => {
    it('应该将趋势详情卡位置限制在视口左右留白内', () => {
      expect(calculateTrendDetailLeft({
        nodeLeft: 300,
        nodeWidth: 80,
        viewportLeft: 100,
        viewportWidth: 500
      })).toBe(106);
      expect(calculateTrendDetailLeft({
        nodeLeft: 100,
        nodeWidth: 80,
        viewportLeft: 100,
        viewportWidth: 500
      })).toBe(16);
      expect(calculateTrendDetailLeft({
        nodeLeft: 590,
        nodeWidth: 80,
        viewportLeft: 100,
        viewportWidth: 500
      })).toBe(216);
    });

    it('应该只在趋势视口左右边缘计算滚动速度', () => {
      expect(calculateTrendEdgeVelocity(0, 500)).toBeCloseTo(-4.2);
      expect(calculateTrendEdgeVelocity(50, 500)).toBeCloseTo(-2.1);
      expect(calculateTrendEdgeVelocity(250, 500)).toBe(0);
      expect(calculateTrendEdgeVelocity(450, 500)).toBeCloseTo(2.1);
      expect(calculateTrendEdgeVelocity(500, 500)).toBeCloseTo(4.2);
    });

    it('应该计算缓动滚动状态并限制在首尾边界', () => {
      expect(calculateTrendScrollStep({
        scrollLeft: 200,
        scrollWidth: 1100,
        clientWidth: 500,
        currentVelocity: 0,
        desiredVelocity: 4.2
      })).toMatchObject({
        scrollLeft: 200.756,
        velocity: 0.756,
        reachedBoundary: false
      });
      expect(calculateTrendScrollStep({
        scrollLeft: 600,
        scrollWidth: 1100,
        clientWidth: 500,
        currentVelocity: 4,
        desiredVelocity: 4.2
      })).toEqual({
        scrollLeft: 600,
        velocity: 0,
        reachedBoundary: true
      });
    });

    it('应该按数据最大值生成包含零点的整齐 Y 轴刻度', () => {
      expect(createYAxisTicks(13)).toEqual([0, 5, 10, 15, 20]);
      expect(createYAxisTicks(0)).toEqual([0, 1, 2, 3, 4]);
    });

    it('应该按统一坐标系生成三组趋势点位', () => {
      const points = buildTrendPoints([
        { shopCount: 10, rented: 6, vacant: 2 },
        { shopCount: 20, rented: 12, vacant: 5 },
        { shopCount: 5, rented: 3, vacant: 1 }
      ], {
        plotWidth: 200,
        plotHeight: 100,
        yMax: 20
      });

      expect(points).toHaveLength(3);
      expect(points.map(point => point.x)).toEqual([0, 100, 200]);
      expect(points[1]).toMatchObject({
        totalY: 0,
        rentedY: 40,
        vacantY: 75
      });
      expect(points[0].totalY).toBeLessThan(points[0].rentedY);
      expect(points[0].rentedY).toBeLessThan(points[0].vacantY);
    });

    it('应该将站名按每五个字符分行且不产生空行', () => {
      expect(formatStationNameLines('苏州新区火车站')).toEqual(['苏州新区火', '车站']);
      expect(formatStationNameLines('花桥')).toEqual(['花桥']);
      expect(formatStationNameLines('')).toEqual([]);
    });

    it('应该组合等级筛选与去除首尾空格后的站名搜索', () => {
      const stations = [
        { name: '花桥', grade: 's', rate: 92 },
        { name: '花溪公园', grade: 'a', rate: 76 },
        { name: '兵希', grade: 'B', rate: 60 }
      ];

      expect(filterStationStats(stations, {
        filter: 'priority',
        query: '  花  '
      }).map(station => station.name)).toEqual(['花桥', '花溪公园']);

      expect(filterStationStats(stations, {
        filter: 'low',
        query: ''
      }).map(station => station.name)).toEqual(['花溪公园', '兵希']);
    });
  });

  describe('XSS 防护', () => {
    it('renderStationTable 应该转义商铺名称中的脚本标签', () => {
      document.body.innerHTML = '<div id="layer-stations"></div>';
      const stationStats = [{
        name: '测试站',
        grade: 'A',
        transfer: false,
        shops: [{
          shortNo: 'S11-1',
          name: '<img src=x onerror=alert(1)>',
          type: '商铺',
          area: 20,
          tenant: '<script>alert(1)</script>',
          status: '未出租'
        }],
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '0.0',
        rented: 0,
        vacant: 1,
        renovating: 0,
        rate: 0,
        rateStr: '0.0%'
      }];

      renderStationTable(stationStats);
      const container = document.getElementById('layer-stations');
      expect(container.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(container.innerHTML).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(container.innerHTML).not.toContain('<img src=x onerror=alert(1)>');
    });

    it('renderStationTable 应该安全输出站点名、等级、属性和状态', () => {
      document.body.innerHTML = '<div id="layer-stations"></div>';
      const stationStats = [{
        name: '<img src=x onerror=alert(1)>',
        grade: 'A" onclick="alert(2)',
        transfer: false,
        shops: [{
          shortNo: '<script>alert(3)</script>',
          name: '测试商铺',
          type: '<img src=x onerror=alert(4)>',
          area: '<img src=x onerror=alert(5)>',
          tenant: '测试租户',
          status: '<img src=x onerror=alert(6)>'
        }],
        shopCount: 1,
        multiSpot: 0,
        totalArea: '20.0',
        rentedArea: '0.0',
        rented: 0,
        vacant: 1,
        renovating: 0,
        rate: 0,
        rateStr: '0.0%'
      }];

      renderStationTable(stationStats);
      const container = document.getElementById('layer-stations');

      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('script')).toBeNull();
      expect(container.querySelector('[onclick]')).toBeNull();
      expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
      expect(container.textContent).toContain('<img src=x onerror=alert(5)>');
      expect(container.textContent).toContain('<img src=x onerror=alert(6)>');
      expect(container.querySelector('.grade-badge').className).toBe('grade-badge');
    });

    it('updateTooltipContent 应该转义商铺名称和租户名', () => {
      document.body.innerHTML = '<div id="ttGrade"></div><div id="ttName"></div><div id="ttTransfer"></div><div id="ttShops"></div><div id="ttMulti"></div><div id="ttRate"></div><div id="ttShopList"></div>';
      const station = {
        name: '测试站',
        grade: 'A',
        transfer: false,
        shopCount: 1,
        multiSpot: 0,
        rateStr: '0.0%',
        shops: [{
          name: '<img src=x onerror=alert(1)>',
          tenant: '<script>alert(1)</script>',
          type: '商铺',
          status: '未出租'
        }]
      };

      updateTooltipContent(station);
      const listEl = document.getElementById('ttShopList');
      expect(listEl.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(listEl.innerHTML).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('updateTooltipContent 应该将站点名和等级作为纯文本输出', () => {
      document.body.innerHTML = '<div id="ttGrade"></div><div id="ttName"></div><div id="ttTransfer"></div><div id="ttShops"></div><div id="ttMulti"></div><div id="ttRate"></div><div id="ttShopList"></div>';
      const station = {
        name: '<img src=x onerror=alert(1)>',
        grade: 'A extra-class',
        transfer: false,
        shopCount: 0,
        multiSpot: 0,
        rateStr: '0.0%',
        shops: []
      };

      updateTooltipContent(station);

      expect(document.getElementById('ttName').textContent).toBe('<img src=x onerror=alert(1)>站');
      expect(document.getElementById('ttGrade').textContent).toBe('A extra-class');
      expect(document.getElementById('ttGrade').className).toBe('tooltip-grade');
      expect(document.querySelector('img')).toBeNull();
    });
  });
});
