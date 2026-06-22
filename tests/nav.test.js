/**
 * 导航模块测试 —— js/modules/nav.js
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

    it('应该显示确认的 Logo 和双行品牌文案', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');

      const logo = document.querySelector('.topnav-logo');
      expect(logo).toBeInstanceOf(HTMLImageElement);
      expect(logo.getAttribute('src')).toBe('assets/design/logo-concept-02-v1-160.png');
      expect(logo.getAttribute('width')).toBe('40');
      expect(logo.getAttribute('height')).toBe('40');
      expect(logo.getAttribute('alt')).toBe('');
      expect(document.querySelector('.topnav-title').textContent).toBe('11号线商业信息综合平台');
      expect(document.querySelector('.topnav-subtitle').textContent).toBe('苏州轨道交通 · 商业资产与点位管理');
    });

    it('应该包含三个现有路由的新导航文案', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      const links = document.querySelectorAll('.topnav-links .nav-link');
      expect(links.length).toBe(3);
      expect([...links].map(link => link.textContent)).toEqual(['经营总览', '商业信息管理', '线路资产']);
      expect(document.body.textContent).not.toContain('商业分析');
      expect([...links].map(link => link.getAttribute('href'))).toEqual([
        'index.html',
        'data-viz.html',
        'battle-map.html'
      ]);
    });

    it('当前页链接应该有 active 类', async () => {
      const { initNav } = await loadNavModule();
      initNav('data');
      const activeLink = document.querySelector('.nav-link.active');
      expect(activeLink).not.toBeNull();
      expect(activeLink.textContent).toBe('商业信息管理');
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
      expect([...items].map(item => item.textContent)).toEqual(['总览', '商业信息管理', '资产']);
      expect([...items].map(item => item.dataset.page)).toEqual(['home', 'data', 'battle']);
    });

    it('数据页底部导航应显示新名称且保持 data 激活态', async () => {
      const { initNav } = await loadNavModule();
      initNav('data');
      const activeItem = document.querySelector('.bottom-nav .bnav-item.active');
      expect(activeItem.dataset.page).toBe('data');
      expect(activeItem.textContent).toBe('商业信息管理');
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

  describe('重复初始化', () => {
    it('多次调用 initNav 应该只保留一套导航并使用最后的激活页', async () => {
      const { initNav } = await loadNavModule();

      initNav('home');
      initNav('battle');

      expect(document.querySelectorAll('.topnav')).toHaveLength(1);
      expect(document.querySelectorAll('.bottom-nav')).toHaveLength(1);
      expect(document.querySelector('.topnav .nav-link.active').dataset.page).toBe('battle');
      expect(document.querySelector('.bottom-nav .bnav-item.active').dataset.page).toBe('battle');
    });
  });

  describe('数据来源指示器', () => {
    it('initNav 应注入 #datasource-indicator 元素', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      const indicator = document.getElementById('datasource-indicator');
      expect(indicator).not.toBeNull();
    });

    it('初始状态应显示"检测中…"', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      const indicator = document.getElementById('datasource-indicator');
      expect(indicator.textContent).toContain('检测中');
    });

    it('收到 datasource:change server 事件后应显示"服务器数据"', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      window.dispatchEvent(new CustomEvent('datasource:change', { detail: { source: 'server' } }));
      const indicator = document.getElementById('datasource-indicator');
      expect(indicator.textContent).toContain('服务器数据');
    });

    it('收到 datasource:change local 事件后应显示"本地缓存"', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      window.dispatchEvent(new CustomEvent('datasource:change', { detail: { source: 'local' } }));
      const indicator = document.getElementById('datasource-indicator');
      expect(indicator.textContent).toContain('本地缓存');
    });

    it('收到 datasource:change default 事件后应显示"演示数据"', async () => {
      const { initNav } = await loadNavModule();
      initNav('home');
      window.dispatchEvent(new CustomEvent('datasource:change', { detail: { source: 'default' } }));
      const indicator = document.getElementById('datasource-indicator');
      expect(indicator.textContent).toContain('演示数据');
    });
  });

  describe('CSP 兼容资源', () => {
    it.each(['index.html', 'data-viz.html', 'battle-map.html'])(
      '%s 不应该引用外部字体或样式',
      (filename) => {
        const html = readFileSync(resolve(process.cwd(), filename), 'utf8');
        expect(html).not.toMatch(/<link[^>]+href=["']https?:\/\//i);
      }
    );

    it('platform.css 不应该导入外部字体样式', () => {
      const css = readFileSync(resolve(process.cwd(), 'css/platform.css'), 'utf8');
      expect(css).not.toMatch(/@import\s+url\(["']?https?:\/\//i);
    });
  });
});
