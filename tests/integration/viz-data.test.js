/**
 * viz + data 集成测试 — 验证 viz 通过 data.js 加载/保存数据
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { state } from '../../js/modules/state.js';
import * as data from '../../js/modules/data.js';

describe('viz ↔ data 集成', () => {
  beforeEach(() => {
    // 重置共享状态
    state.stations = [];
    state.globalStats = {};

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('数据加载流程', () => {
    it('loadData 应通过 API 加载数据并写入 state.stations', async () => {
      const mockStations = [
        { id: 's1', name: '测试站', grade: 'A', shops: [], transfer: false, x: 100, y: 480, pos: 'top' }
      ];
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { stations: mockStations } })
        })
      ));

      await data.loadData();
      expect(state.stations.length).toBe(1);
      expect(state.stations[0].name).toBe('测试站');
    });

    it('API 不可用时应回退到 localStorage', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('网络错误'))));

      const savedData = { stations: [{ id: 'local1', name: '本地站', grade: 'B', shops: [], x: 200, y: 480, pos: 'top' }] };
      localStorage.getItem = vi.fn(() => JSON.stringify(savedData));

      await data.loadData();
      expect(state.stations.length).toBe(1);
      expect(state.stations[0].name).toBe('本地站');
    });

    it('API 和 localStorage 均不可用时应使用默认数据', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('网络错误'))));
      localStorage.getItem = vi.fn(() => null);

      await data.loadData();
      // 默认数据有 28 个站点
      expect(state.stations.length).toBe(28);
    });
  });

  describe('数据保存流程', () => {
    it('saveData 应将数据 POST 到 API', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ versions: {} }) })
      ));

      state.stations = [{ id: 's1', name: '保存测试', grade: 'A', shops: [], x: 100, y: 480, pos: 'top' }];
      const result = await data.saveData();

      expect(result.success).toBe(true);
      expect(result.source).toBe('server');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('API 保存失败应回退到 localStorage', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('保存失败'))));

      state.stations = [{ id: 's1', name: '回退测试', grade: 'A', shops: [], x: 100, y: 480, pos: 'top' }];
      const result = await data.saveData();

      expect(result.success).toBe(true);
      expect(result.source).toBe('local');
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('保存站点详情时请求体应保留 shops[].photo 字段', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ versions: {} }) })
      ));
      const photo = 'data:image/png;base64,iVBORw0KGgo==';
      state.stations = [{
        id: 's1', name: '保存测试', grade: 'A', shops: [
          { no: 1, shortNo: 'S11-1', name: '照片商铺', type: '商铺', area: 10, status: '营业中', photo }
        ], x: 100, y: 480, pos: 'top', version: 0
      }];
      await data.saveData();
      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.data.stations[0].shops[0].photo).toBe(photo);
    });

    it('删除商铺后保存时请求体中不应保留已删除商铺的照片', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ versions: {} }) })
      ));
      state.stations = [{
        id: 's1', name: '保存测试', grade: 'A', shops: [
          { no: 1, shortNo: 'S11-1', name: '保留商铺', type: '商铺', area: 10, status: '营业中', photo: '' }
        ], x: 100, y: 480, pos: 'top', version: 0
      }];
      await data.saveData();
      const body = JSON.parse(fetch.mock.calls[0][1].body);
      // 只有一个商铺
      expect(body.data.stations[0].shops.length).toBe(1);
    });
  });
});
