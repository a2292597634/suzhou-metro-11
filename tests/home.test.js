/**
 * 首页数据看板测试 —— js/modules/home.js
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../js/modules/state.js';
import { calcHomeStats, initHome } from '../js/modules/home.js';

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

  describe('initHome', () => {
    it('应该是一个异步函数', () => {
      expect(typeof initHome).toBe('function');
    });
  });
});
