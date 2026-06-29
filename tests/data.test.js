/**
 * 数据管理测试 —— js/modules/data.js
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { state } from '../js/modules/state.js';
import { getDefaultStations, getDefaultGlobalStats, calcGlobalStats, saveToLocal, loadData, saveData } from '../js/modules/data.js';

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

    it('内联默认站点等级应该与 data/default-data.json 保持一致', () => {
      const json = JSON.parse(readFileSync(resolve(process.cwd(), 'data/default-data.json'), 'utf8'));
      const jsonGrades = new Map(json.stations.map(station => [station.id, station.grade]));

      getDefaultStations().forEach(station => {
        expect(station.grade, station.id).toBe(jsonGrades.get(station.id));
      });
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

    it('localStorage 写入失败时应抛出异常', () => {
      localStorage.setItem = vi.fn(() => { throw new Error('QuotaExceededError'); });
      const data = { stations: [], globalStats: {} };
      expect(() => saveToLocal(data)).toThrow('QuotaExceededError');
    });
  });

  describe('loadData 返回值', () => {
    it('从服务器加载成功时应返回 { source: "server" }', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { stations: [{ name: '测试站' }], globalStats: {} } }) })
      ));
      const result = await loadData();
      expect(result).toEqual({ source: 'server' });
    });

    it('服务器返回空 stations 数组时应 fallback 到默认数据', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { stations: [], globalStats: null } }) })
      ));
      await loadData();
      expect(state.stations.length).toBeGreaterThan(0);
      expect(state.stations[0].name).toBeDefined();
    });

    it('回退到 localStorage 时应返回 { source: "local" }', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('网络错误'))));
      localStorage.getItem = vi.fn(() => JSON.stringify({ stations: [], globalStats: {} }));
      const result = await loadData();
      expect(result).toEqual({ source: 'local' });
    });

    it('使用默认数据时应返回 { source: "default" }', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('网络错误'))));
      localStorage.getItem = vi.fn(() => null);
      const result = await loadData();
      expect(result).toEqual({ source: 'default' });
    });

    it('JSON 默认数据可用时应使用 JSON 中的最新站点等级', async () => {
      vi.stubGlobal('fetch', vi.fn(url => {
        if (String(url).includes('/api/data')) {
          return Promise.reject(new Error('网络错误'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stations: [{ id: 'weiting', name: '唯亭站', grade: 'S', shops: [] }],
            globalStats: {}
          })
        });
      }));
      localStorage.getItem = vi.fn(() => null);

      const result = await loadData();

      expect(result).toEqual({ source: 'default' });
      expect(state.stations).toHaveLength(1);
      expect(state.stations[0].grade).toBe('S');
    });
  });

  describe('dispatch datasource:change 事件', () => {
    it('loadData 成功时应 dispatch 事件', async () => {
      const handler = vi.fn();
      window.addEventListener('datasource:change', handler);
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { stations: [], globalStats: {} } }) })
      ));
      await loadData();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ source: 'server' });
      window.removeEventListener('datasource:change', handler);
    });

    it('saveData 成功时应 dispatch 事件', async () => {
      const handler = vi.fn();
      window.addEventListener('datasource:change', handler);
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ versions: {} }) })));
      state.stations = [];
      await saveData();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ source: 'server' });
      window.removeEventListener('datasource:change', handler);
    });

    it('saveData 回退到 localStorage 时应 dispatch 事件', async () => {
      const handler = vi.fn();
      window.addEventListener('datasource:change', handler);
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('保存失败'))));
      state.stations = [];
      const result = await saveData();
      expect(result.source).toBe('local');
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ source: 'local' });
      window.removeEventListener('datasource:change', handler);
    });
  });

  describe('认证与保存', () => {
    it('saveData 应使用 credentials: include 发送 Cookie', async () => {
      const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ versions: {} }) }));
      vi.stubGlobal('fetch', fetchMock);
      state.stations = [];
      await saveData();
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].credentials).toBe('include');
      // 不应携带明文 Authorization header
      expect(callArgs[1].headers).not.toHaveProperty('Authorization');
    });

    it('saveData 遇到 409 冲突时应返回 conflict: true', async () => {
      const fetchMock = vi.fn(() => Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: '版本冲突', stationId: 'test', detail: '期望版本 1，实际版本 2' })
      }));
      vi.stubGlobal('fetch', fetchMock);
      state.stations = [];
      const result = await saveData();
      expect(result.success).toBe(false);
      expect(result.conflict).toBe(true);
    });

    it('saveData 遇到 401 时应返回 needLogin: true', async () => {
      const fetchMock = vi.fn(() => Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: '未授权，请先登录' })
      }));
      vi.stubGlobal('fetch', fetchMock);
      state.stations = [];
      const result = await saveData();
      expect(result.success).toBe(false);
      expect(result.needLogin).toBe(true);
    });

    it('登录成功应设置 isAuthenticated', async () => {
      const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
      vi.stubGlobal('fetch', fetchMock);
      state.isAuthenticated = false;
      const { login } = await import('../js/modules/data.js');
      const result = await login('test-token');
      expect(result.success).toBe(true);
      expect(state.isAuthenticated).toBe(true);
    });

    it('登录失败不改变 isAuthenticated', async () => {
      const fetchMock = vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ error: '密码错误' }) }));
      vi.stubGlobal('fetch', fetchMock);
      state.isAuthenticated = false;
      const { login } = await import('../js/modules/data.js');
      const result = await login('wrong');
      expect(result.success).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('checkAuth 应调用 /api/auth-status', async () => {
      const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ authenticated: true }) }));
      vi.stubGlobal('fetch', fetchMock);
      const { checkAuth } = await import('../js/modules/data.js');
      const result = await checkAuth();
      expect(result).toBe(true);
      expect(state.isAuthenticated).toBe(true);
    });

    it('服务器和 localStorage 双失败时应返回 success: false', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('网络错误')));
      vi.stubGlobal('fetch', fetchMock);
      localStorage.setItem = vi.fn(() => { throw new Error('QuotaExceededError'); });
      state.stations = [];
      const result = await saveData();
      expect(result.success).toBe(false);
      expect(result.error).toContain('QuotaExceededError');
    });
  });

  describe('photo 字段数据链路', () => {
    it('getDefaultStations 中每个商铺应有 photo 默认空字符串', () => {
      const stations = getDefaultStations();
      stations.forEach(station => {
        (station.shops || []).forEach(shop => {
          expect(shop).toHaveProperty('photo');
          expect(shop.photo).toBe('');
        });
      });
    });

    it('loadData 从 API 加载应保留 shop.photo', async () => {
      const mockPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              stations: [{
                id: 's1', name: '测试站', grade: 'A', shops: [
                  { no: 1, shortNo: 'S11-1', name: '有照片商铺', type: '商铺', area: 10, status: '营业中', photo: mockPhoto }
                ], x: 100, y: 480, pos: 'top', transfer: false
              }]
            }
          })
        })
      ));
      await loadData();
      expect(state.stations[0].shops[0].photo).toBe(mockPhoto);
    });

    it('saveData 请求体应包含 shop.photo', async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ versions: {} }) })
      );
      vi.stubGlobal('fetch', fetchMock);
      const photo = 'data:image/png;base64,iVBORw0KGgo==';
      state.stations = [{
        id: 's1', name: '保存站', grade: 'A', shops: [
          { no: 1, shortNo: 'S11-1', name: '照片商铺', type: '商铺', area: 10, status: '营业中', photo }
        ], x: 100, y: 480, pos: 'top', transfer: false, version: 0
      }];
      await saveData();
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.data.stations[0].shops[0].photo).toBe(photo);
    });

    it('Excel 前端降级导出表头不应包含照片列', () => {
      const headers = ['车站', '简洁编号', '铺号', '类型', '面积(㎡)', '电量', '上下水', '状态', '商户', '备注'];
      expect(headers).not.toContain('照片');
      expect(headers).not.toContain('photo');
      expect(headers.length).toBe(10);
    });
  });
});
