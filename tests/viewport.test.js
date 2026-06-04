/**
 * 视口控制测试 —— js/modules/viewport.js
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { state } from '../js/modules/state.js';
import { getAppSize, applyTransform, zoom, fitToScreen, resetViewport, initViewport } from '../js/modules/viewport.js';

describe('视口控制', () => {
  beforeEach(() => {
    // 重置 state
    state.viewport.scale = 1;
    state.viewport.x = 0;
    state.viewport.y = 0;
    state.viewport.minScale = 0.3;
    state.viewport.maxScale = 3;

    document.body.innerHTML = '<div id="app" style="width:1000px;height:600px;"><div class="battle-map"></div></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getAppSize', () => {
    it('应该返回 #app 元素的尺寸', () => {
      const app = document.getElementById('app');
      app.getBoundingClientRect = () => ({
        width: 1000, height: 600,
        top: 0, left: 0, bottom: 600, right: 1000
      });
      const size = getAppSize();
      expect(size.width).toBe(1000);
      expect(size.height).toBe(600);
    });
  });

  describe('zoom', () => {
    it('应该限制缩放范围', () => {
      state.viewport.scale = 1;

      // 放大到超过 maxScale
      for (let i = 0; i < 20; i++) zoom(-1, 500, 300);
      expect(state.viewport.scale).toBeLessThanOrEqual(3);

      // 缩小到低于 minScale
      state.viewport.scale = 1;
      for (let i = 0; i < 20; i++) zoom(1, 500, 300);
      expect(state.viewport.scale).toBeGreaterThanOrEqual(0.3);
    });

    it('放大时 scale 应该增加', () => {
      state.viewport.scale = 1;
      state.viewport.x = 0;
      state.viewport.y = 0;

      zoom(-1, 500, 300);

      expect(state.viewport.scale).toBeGreaterThan(1);
    });

    it('缩小时 scale 应该减小', () => {
      state.viewport.scale = 1;
      state.viewport.x = 0;
      state.viewport.y = 0;

      zoom(1, 500, 300);

      expect(state.viewport.scale).toBeLessThan(1);
    });
  });

  describe('resetViewport', () => {
    it('应该重置视口到初始状态', () => {
      state.viewport.scale = 2;
      state.viewport.x = 100;
      state.viewport.y = 50;

      resetViewport();

      expect(state.viewport.x).toBe(0);
      expect(state.viewport.y).toBe(0);
      expect(state.viewport.scale).toBeLessThanOrEqual(1);
    });
  });

  describe('fitToScreen', () => {
    it('视口偏移过大时应该重置', () => {
      state.viewport.scale = 1;
      state.viewport.x = 5000;
      state.viewport.y = 5000;

      fitToScreen();

      expect(state.viewport.x).toBe(0);
      expect(state.viewport.y).toBe(0);
    });
  });

  describe('applyTransform', () => {
    it('应该设置 transform 样式', () => {
      state.viewport.x = 100;
      state.viewport.y = 50;
      state.viewport.scale = 1.5;

      applyTransform();

      const map = document.querySelector('.battle-map');
      expect(map.style.transform).toContain('translate(100px, 50px)');
      expect(map.style.transform).toContain('scale(1.5)');
    });
  });

  describe('initViewport', () => {
    it('应该初始化视口', () => {
      initViewport();
      expect(state.viewport.scale).toBeLessThanOrEqual(1);
      expect(state.viewport.x).toBe(0);
      expect(state.viewport.y).toBe(0);
    });
  });
});
