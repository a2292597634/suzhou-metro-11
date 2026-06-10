/**
 * 首页数据看板测试 —— js/modules/home.js
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../js/modules/state.js';
import { calcHomeStats, initHome, renderStationTable, updateTooltipContent } from '../js/modules/home.js';

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
  });
});
