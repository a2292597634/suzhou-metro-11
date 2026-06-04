/**
 * 页面集成测试 —— 验证 nav.js + router.js 联动
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function loadNavModule() {
  document.querySelectorAll('.topnav, .bottom-nav').forEach(el => el.remove());
  const navModule = await import('../../js/modules/nav.js?v=' + Date.now());
  return navModule;
}

async function loadRouterModule() {
  const routerModule = await import('../../js/modules/router.js?v=' + Date.now());
  return routerModule;
}

describe('页面集成', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.stubGlobal('history', {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      state: null
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  describe('三页导航', () => {
    it('nav.js 应该在三个页面都注入导航栏', async () => {
      const pages = ['index.html', 'data-viz.html', 'battle-map.html'];
      for (const page of pages) {
        delete window.location;
        window.location = new URL('http://localhost/' + page);
        document.body.innerHTML = '';

        const { initNav } = await loadNavModule();
        initNav();

        const topnav = document.querySelector('.topnav');
        const bottomNav = document.querySelector('.bottom-nav');
        expect(topnav).not.toBeNull();
        expect(bottomNav).not.toBeNull();

        const links = document.querySelectorAll('.topnav-links .nav-link');
        expect(links.length).toBe(3);
      }
    });

    it('三个页面的导航链接应指向正确的 HTML 文件', async () => {
      delete window.location;
      window.location = new URL('http://localhost/index.html');
      const { initNav } = await loadNavModule();
      initNav();

      const links = document.querySelectorAll('.topnav-links .nav-link');
      expect(links[0].getAttribute('href')).toBe('index.html');
      expect(links[1].getAttribute('href')).toBe('data-viz.html');
      expect(links[2].getAttribute('href')).toBe('battle-map.html');
    });
  });

  describe('当前页面高亮', () => {
    it('首页应高亮「首页」链接', async () => {
      delete window.location;
      window.location = new URL('http://localhost/index.html');
      const { initNav } = await loadNavModule();
      initNav();

      const activeLink = document.querySelector('.nav-link.active');
      expect(activeLink).not.toBeNull();
      expect(activeLink.dataset.page).toBe('home');
    });

    it('数据页应高亮「商业数据」链接', async () => {
      delete window.location;
      window.location = new URL('http://localhost/data-viz.html');
      const { initNav } = await loadNavModule();
      initNav();

      const activeLink = document.querySelector('.nav-link.active');
      expect(activeLink).not.toBeNull();
      expect(activeLink.dataset.page).toBe('data');
    });

    it('作战图页应高亮「作战图」链接', async () => {
      delete window.location;
      window.location = new URL('http://localhost/battle-map.html');
      const { initNav } = await loadNavModule();
      initNav();

      const activeLink = document.querySelector('.nav-link.active');
      expect(activeLink).not.toBeNull();
      expect(activeLink.dataset.page).toBe('battle');
    });
  });

  describe('nav + router 页面标识一致性', () => {
    it('nav.js 和 router.js 的页面标识应一致', async () => {
      delete window.location;
      window.location = new URL('http://localhost/index.html');

      const { initNav } = await loadNavModule();
      const { initRouter, getCurrentPage } = await loadRouterModule();

      initNav();
      initRouter();

      // router 解析当前页面
      const routerPage = getCurrentPage();

      // nav 激活态应匹配 router 的当前页面
      const activeLink = document.querySelector('.nav-link.active');
      expect(activeLink.dataset.page).toBe(routerPage);
    });

    it('三个页面的标识在 nav 和 router 中应对应相同文件名', async () => {
      const { initNav } = await loadNavModule();
      const { initRouter, getCurrentPage } = await loadRouterModule();

      const testCases = [
        { path: '/index.html', page: 'home' },
        { path: '/data-viz.html', page: 'data' },
        { path: '/battle-map.html', page: 'battle' }
      ];

      for (const { path, page } of testCases) {
        delete window.location;
        window.location = new URL('http://localhost' + path);
        document.body.innerHTML = '';

        initNav();
        initRouter();

        expect(getCurrentPage()).toBe(page);
        const activeLink = document.querySelector('.nav-link.active');
        expect(activeLink.dataset.page).toBe(page);
      }
    });
  });

  describe('URL 同步', () => {
    it('router.initRouter 应调用 history.pushState 同步 page 参数', async () => {
      delete window.location;
      window.location = new URL('http://localhost/index.html');
      const { initRouter } = await loadRouterModule();
      initRouter();
      expect(window.history.pushState).toHaveBeenCalled();
    });
  });

  describe('移动端底部 Tab', () => {
    it('底部 Tab 栏应包含三个标签', async () => {
      delete window.location;
      window.location = new URL('http://localhost/index.html');
      const { initNav } = await loadNavModule();
      initNav();

      const items = document.querySelectorAll('.bottom-nav .bnav-item');
      expect(items.length).toBe(3);
    });

    it('底部 Tab 项应包含图标和文字', async () => {
      delete window.location;
      window.location = new URL('http://localhost/index.html');
      const { initNav } = await loadNavModule();
      initNav();

      const items = document.querySelectorAll('.bottom-nav .bnav-item');
      items.forEach(item => {
        expect(item.querySelector('svg')).not.toBeNull();
        expect(item.querySelector('span')).not.toBeNull();
      });
    });
  });
});
