/**
 * 导航模块测试 —— js/modules/nav.js
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// nav.js 使用 ES module，且依赖 DOM，需要在 jsdom 中动态导入
async function loadNavModule() {
  // 清理已有导航
  document.querySelectorAll('.topnav, .bottom-nav').forEach(el => el.remove());
  // 动态导入模块（每次重新加载以获取全新状态）
  const navModule = await import('../js/modules/nav.js?v=' + Date.now());
  return navModule;
}

describe('导航模块', () => {
  beforeEach(() => {
    // 重置 document.body
    document.body.innerHTML = '';
    // 重置 location
    delete window.location;
    window.location = new URL('http://localhost/index.html');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('detectActivePage', () => {
    it('应该识别首页', async () => {
      window.location = new URL('http://localhost/index.html');
      const { initNav } = await loadNavModule();
      initNav();
      const activeLink = document.querySelector('.nav-link.active');
      expect(activeLink).not.toBeNull();
      expect(activeLink.dataset.page).toBe('home');
    });

    it('应该识别数据页', async () => {
      window.location = new URL('http://localhost/data-viz.html');
      const { initNav } = await loadNavModule();
      initNav();
      const activeLink = document.querySelector('.nav-link.active');
      expect(activeLink).not.toBeNull();
      expect(activeLink.dataset.page).toBe('data');
    });

    it('应该识别作战图页', async () => {
      window.location = new URL('http://localhost/battle-map.html');
      const { initNav } = await loadNavModule();
      initNav();
      const activeLink = document.querySelector('.nav-link.active');
      expect(activeLink).not.toBeNull();
      expect(activeLink.dataset.page).toBe('battle');
    });
  });

  describe('createTopNav', () => {
    it('应该注入顶部导航栏到 body 开头', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      const topnav = document.querySelector('.topnav');
      expect(topnav).not.toBeNull();
      expect(document.body.firstElementChild).toBe(topnav);
    });

    it('应该包含品牌区、导航链接和操作区', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      expect(document.querySelector('.topnav-brand')).not.toBeNull();
      expect(document.querySelector('.topnav-links')).not.toBeNull();
      expect(document.querySelector('.topnav-actions')).not.toBeNull();
    });

    it('应该包含三个导航链接', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      const links = document.querySelectorAll('.topnav-links .nav-link');
      expect(links.length).toBe(3);
      expect(links[0].textContent).toBe('首页');
      expect(links[1].textContent).toBe('商业数据');
      expect(links[2].textContent).toBe('作战图');
    });

    it('当前页链接应该有 active 类', async () => {
      const { initNav } = await loadNavModule();
      initNav('data');
      const activeLink = document.querySelector('.nav-link.active');
      expect(activeLink).not.toBeNull();
      expect(activeLink.textContent).toBe('商业数据');
    });
  });

  describe('createBottomNav', () => {
    it('应该注入底部导航栏到 body 末尾', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      const bottomNav = document.querySelector('.bottom-nav');
      expect(bottomNav).not.toBeNull();
      expect(document.body.lastElementChild).toBe(bottomNav);
    });

    it('应该包含三个标签按钮', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      const items = document.querySelectorAll('.bottom-nav .bnav-item');
      expect(items.length).toBe(3);
    });
  });

  describe('updateActiveState', () => {
    it('应该能更新导航激活状态', async () => {
      const { initNav, updateActiveState } = await loadNavModule();
      initNav('home');
      updateActiveState('battle');
      const activeLink = document.querySelector('.topnav .nav-link.active');
      expect(activeLink.dataset.page).toBe('battle');
    });
  });
});
