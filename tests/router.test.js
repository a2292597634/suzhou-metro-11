/**
 * 路由模块测试 —— js/modules/router.js
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function mockLocation(pathname) {
  vi.stubGlobal('location', {
    pathname,
    search: '',
    href: 'http://localhost' + pathname,
    assign: vi.fn(),
    replace: vi.fn()
  });
}

async function loadRouterModule() {
  // 每次用时间戳强制重新加载，避免模块级状态缓存
  const routerModule = await import('../js/modules/router.js?v=' + Date.now());
  return routerModule;
}

describe('路由模块', () => {
  beforeEach(() => {
    // mock history API 避免 jsdom SecurityError
    vi.stubGlobal('history', {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      state: null
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('页面解析', () => {
    it('应该从路径解析首页', async () => {
      mockLocation('/index.html');
      const { initRouter, getCurrentPage } = await loadRouterModule();
      initRouter();
      expect(getCurrentPage()).toBe('home');
    });

    it('应该从路径解析数据页', async () => {
      mockLocation('/data-viz.html');
      const { initRouter, getCurrentPage } = await loadRouterModule();
      initRouter();
      expect(getCurrentPage()).toBe('data');
    });

    it('应该从路径解析作战图页', async () => {
      mockLocation('/battle-map.html');
      const { initRouter, getCurrentPage } = await loadRouterModule();
      initRouter();
      expect(getCurrentPage()).toBe('battle');
    });

    it('应该从无文件名路径解析首页', async () => {
      mockLocation('/');
      const { initRouter, getCurrentPage } = await loadRouterModule();
      initRouter();
      expect(getCurrentPage()).toBe('home');
    });
  });

  describe('动画方向', () => {
    it('home → data 应该是 right', async () => {
      const { getTransitionDirection } = await loadRouterModule();
      expect(getTransitionDirection('home', 'data')).toBe('right');
    });

    it('data → home 应该是 left', async () => {
      const { getTransitionDirection } = await loadRouterModule();
      expect(getTransitionDirection('data', 'home')).toBe('left');
    });

    it('data → battle 应该是 up', async () => {
      const { getTransitionDirection } = await loadRouterModule();
      expect(getTransitionDirection('data', 'battle')).toBe('up');
    });

    it('battle → data 应该是 down', async () => {
      const { getTransitionDirection } = await loadRouterModule();
      expect(getTransitionDirection('battle', 'data')).toBe('down');
    });

    it('相同页面应该是 none', async () => {
      const { getTransitionDirection } = await loadRouterModule();
      expect(getTransitionDirection('home', 'home')).toBe('none');
    });

    it('未知组合应该是 none', async () => {
      const { getTransitionDirection } = await loadRouterModule();
      expect(getTransitionDirection('home', 'unknown')).toBe('none');
    });
  });

  describe('URL 同步', () => {
    it('initRouter 应该调用 history.pushState 同步 page 参数', async () => {
      mockLocation('/index.html');
      const { initRouter } = await loadRouterModule();
      initRouter();
      expect(window.history.pushState).toHaveBeenCalled();
    });
  });

  describe('生命周期钩子', () => {
    it('beforeEach 钩子应该能注册', async () => {
      const { beforeEach } = await loadRouterModule();
      const hook = vi.fn();
      beforeEach(hook);
      expect(hook).not.toHaveBeenCalled();
    });

    it('afterEach 钩子应该能注册', async () => {
      const { afterEach } = await loadRouterModule();
      const hook = vi.fn();
      afterEach(hook);
      expect(hook).not.toHaveBeenCalled();
    });
  });
});
