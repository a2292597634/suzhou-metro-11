/**
 * 数据管理测试 —— js/modules/data.js
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { state } from '../js/modules/state.js';
import { getDefaultStations, getDefaultGlobalStats, calcGlobalStats, saveToLocal } from '../js/modules/data.js';

describe('数据管理', () => {
  beforeEach(() => {
    // 重置共享状态
    state.stations = [];
    state.globalStats = {};

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getDefaultStations', () => {
    it('应该返回 28 个站点', () => {
      const stations = getDefaultStations();
      expect(stations.length).toBe(28);
    });

    it('每个站点应该包含必要字段', () => {
      const stations = getDefaultStations();
      const first = stations[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('grade');
      expect(first).toHaveProperty('shops');
      expect(first).toHaveProperty('x');
      expect(first).toHaveProperty('y');
      expect(first).toHaveProperty('pos');
    });

    it('花桥站应该是换乘站', () => {
      const stations = getDefaultStations();
      const huaqiao = stations.find(s => s.id === 'huaqiao');
      expect(huaqiao).toBeDefined();
      expect(huaqiao.transfer).toBe(true);
    });
  });

  describe('getDefaultGlobalStats', () => {
    it('应该返回默认统计对象', () => {
      const stats = getDefaultGlobalStats();
      expect(stats).toHaveProperty('statsDate');
      expect(stats).toHaveProperty('totalShops');
      expect(stats).toHaveProperty('rentedShops');
      expect(stats).toHaveProperty('vacantShops');
      expect(stats).toHaveProperty('rentRate');
    });
  });

  describe('calcGlobalStats', () => {
    it('应该正确计算出租率', () => {
      state.stations = [
        {
          shops: [
            { type: '商铺', status: '营业中' },
            { type: '商铺', status: '未出租' },
            { type: '多经点位', status: '营业中' }
          ]
        }
      ];
      calcGlobalStats();
      expect(state.globalStats.totalShops).toBe(2);
      expect(state.globalStats.rentedShops).toBe(1);
      expect(state.globalStats.vacantShops).toBe(1);
    });

    it('多经点位不应计入统计', () => {
      state.stations = [
        {
          shops: [
            { type: '多经点位', status: '营业中' },
            { type: '多经点位', status: '未出租' }
          ]
        }
      ];
      calcGlobalStats();
      expect(state.globalStats.totalShops).toBe(0);
    });

    it('装修中应计入已租', () => {
      state.stations = [
        {
          shops: [
            { type: '商铺', status: '装修中' },
            { type: '商铺', status: '未出租' }
          ]
        }
      ];
      calcGlobalStats();
      expect(state.globalStats.rentedShops).toBe(1);
      expect(state.globalStats.vacantShops).toBe(1);
    });
  });

  describe('saveToLocal', () => {
    it('应该调用 localStorage.setItem', () => {
      const data = { stations: [], globalStats: {} };
      saveToLocal(data);
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });
});
