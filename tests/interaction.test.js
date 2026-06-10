/**
 * 交互处理测试 —— js/modules/interaction.js
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { state } from '../js/modules/state.js';
import { showToast, printMap, closeModal, makeEditable, renderShopTable } from '../js/modules/interaction.js';

describe('交互处理', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    state.editingStationIdx = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('showToast', () => {
    it('应该创建 toast 元素', () => {
      showToast('测试消息');
      const toast = document.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toBe('测试消息');
    });

    it('错误类型应该有红色背景', () => {
      showToast('错误', 'error');
      const toast = document.querySelector('.toast');
      expect(toast.style.background).toContain('255');
    });
  });

  describe('closeModal', () => {
    it('应该清除编辑状态', () => {
      state.editingStationIdx = 5;

      document.body.innerHTML = `
        <div id="stationModal" class="active"></div>
        <div id="overlay" class="active"></div>
      `;

      closeModal();

      expect(state.editingStationIdx).toBeNull();
    });
  });

  describe('printMap', () => {
    it('应该调用 window.print', () => {
      const printSpy = vi.fn();
      vi.stubGlobal('print', printSpy);

      printMap();

      expect(printSpy).toHaveBeenCalled();
    });
  });

  describe('makeEditable', () => {
    it('应该创建 input 元素', () => {
      document.body.innerHTML = '<div class="editable" data-raw="100">100</div>';
      const el = document.querySelector('.editable');

      makeEditable(el, (val) => { el.textContent = val; }, true);

      expect(el.querySelector('input')).not.toBeNull();
    });
  });

  describe('XSS 防护', () => {
    it('renderShopTable 应该转义 input value 中的脚本标签', () => {
      const shops = [{
        name: '<img src=x onerror=alert(1)>',
        type: '<script>alert(1)</script>',
        area: 20,
        tenant: '<script>alert(1)</script>',
        contact: '<script>alert(1)</script>',
        openDate: '<script>alert(1)</script>',
        status: '未出租',
        remark: '<script>alert(1)</script>'
      }];
      const html = renderShopTable(shops);
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html).not.toContain('value="<script>');
      expect(html).not.toContain('value="<img');
    });
  });
});
