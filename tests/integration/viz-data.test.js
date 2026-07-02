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
  });

  describe('照片 API 与静态发布状态', () => {
    it('上传照片应调用 PUT /api/shops/:shopUid/photo 并更新商铺 photo/photoHash', async () => {
      const { uploadShopPhoto } = await import('../../js/modules/viz.js');
      const shop = { shopUid: 'shop_uid_upload', photo: '', photoHash: '' };
      const file = new File([new Uint8Array([1, 2, 3])], 'shop.png', { type: 'image/png' });
      const fetchMock = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ photoUrl: '/api/shop-photos/shop_uid_upload?v=abc123', sha256: 'abc123' })
      }));

      const result = await uploadShopPhoto(shop, file, fetchMock);

      expect(fetchMock).toHaveBeenCalledWith('/api/shops/shop_uid_upload/photo', expect.objectContaining({ method: 'PUT', credentials: 'include' }));
      expect(fetchMock.mock.calls[0][1].body).toBeInstanceOf(FormData);
      expect(result.success).toBe(true);
      expect(shop.photo).toBe('/api/shop-photos/shop_uid_upload?v=abc123');
      expect(shop.photoHash).toBe('abc123');
    });

    it('删除照片应调用 DELETE /api/shops/:shopUid/photo 并清空照片字段', async () => {
      const { deleteShopPhoto } = await import('../../js/modules/viz.js');
      const shop = { shopUid: 'shop_uid_delete', photo: '/api/shop-photos/shop_uid_delete?v=abc123', photoHash: 'abc123' };
      const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }));

      const result = await deleteShopPhoto(shop, fetchMock);

      expect(fetchMock).toHaveBeenCalledWith('/api/shops/shop_uid_delete/photo', expect.objectContaining({ method: 'DELETE', credentials: 'include' }));
      expect(result.success).toBe(true);
      expect(shop.photo).toBe('');
      expect(shop.photoHash).toBe('');
    });

    it('上传失败、401、400 不应误报成功或更新照片字段', async () => {
      const { uploadShopPhoto } = await import('../../js/modules/viz.js');
      const shop = { shopUid: 'shop_uid_fail', photo: '', photoHash: '' };
      const file = new File([new Uint8Array([1])], 'bad.png', { type: 'image/png' });

      const unauthorized = await uploadShopPhoto(shop, file, vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ error: '未授权' }) })));
      expect(unauthorized.success).toBe(false);
      expect(unauthorized.needLogin).toBe(true);
      expect(shop.photo).toBe('');

      const badRequest = await uploadShopPhoto(shop, file, vi.fn(() => Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({ error: '图片类型校验失败' }) })));
      expect(badRequest.success).toBe(false);
      expect(badRequest.error).toContain('图片类型校验失败');
      expect(shop.photo).toBe('');
    });

    it('静态发布状态展示函数应查询状态并可请求重新发布', async () => {
      const { loadStaticPublishStatus, requestStaticPublish } = await import('../../js/modules/viz.js');
      const fetchMock = vi.fn(url => {
        if (String(url).endsWith('/api/static-publish/status')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'failed', error: 'push failed' }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'pending' }) });
      });

      const status = await loadStaticPublishStatus(fetchMock);
      const retry = await requestStaticPublish(fetchMock);

      expect(status).toEqual({ status: 'failed', error: 'push failed' });
      expect(retry).toEqual({ success: true, status: 'pending' });
      expect(fetchMock).toHaveBeenCalledWith('/api/static-publish/request', expect.objectContaining({ method: 'POST', credentials: 'include' }));
    });
  });});
