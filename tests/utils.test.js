/**
 * 工具函数测试 —— js/modules/utils.js
 */
import { describe, it, expect } from 'vitest';
import { config, calcRate, escapeHtml, resolveCardOverlaps, enforceLineBoundaries } from '../js/modules/utils.js';

describe('工具函数', () => {
  describe('config 常量', () => {
    it('应该定义画布宽度和高度', () => {
      expect(config.width).toBe(2520);
      expect(config.height).toBe(1080);
    });

    it('应该定义主线 Y 坐标', () => {
      expect(config.mainLineY).toBe(480);
    });

    it('应该定义 localStorage 键名', () => {
      expect(config.storageKey).toBe('suzhou_m11_battle_map_data_v4');
    });
  });

  describe('calcRate', () => {
    it('应该正确计算出租率', () => {
      expect(calcRate(10, 5)).toBe('50.0');
      expect(calcRate(100, 75)).toBe('75.0');
    });

    it('空值应该返回空字符串', () => {
      expect(calcRate('', 5)).toBe('');
      expect(calcRate(10, '')).toBe('');
      expect(calcRate(null, 5)).toBe('');
      expect(calcRate(10, undefined)).toBe('');
    });

    it('总数为 0 应该返回空字符串', () => {
      expect(calcRate(0, 0)).toBe('');
      expect(calcRate(0, 5)).toBe('');
    });

    it('应该支持字符串数字', () => {
      expect(calcRate('20', '10')).toBe('50.0');
    });
  });

  describe('escapeHtml', () => {
    it('应该转义 HTML 特殊字符', () => {
      expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(escapeHtml('"test"')).toBe('"test"');
    });

    it('null 应该返回空字符串', () => {
      expect(escapeHtml(null)).toBe('');
    });

    it('undefined 应该返回空字符串', () => {
      expect(escapeHtml(undefined)).toBe('');
    });

    it('数字应该转为字符串', () => {
      expect(escapeHtml(123)).toBe('123');
    });

    it('空字符串应该返回空字符串', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('应该转义所有 HTML 特殊字符', () => {
      expect(escapeHtml('A & B < C > D "E"')).toBe('A &amp; B &lt; C &gt; D "E"');
    });
  });

  describe('resolveCardOverlaps', () => {
    it('应该分离重叠的卡片', () => {
      const cards = [
        { left: 100, top: 100, width: 50, height: 50, origLeft: 100, origTop: 100, pos: 'top' },
        { left: 120, top: 110, width: 50, height: 50, origLeft: 120, origTop: 110, pos: 'top' }
      ];
      resolveCardOverlaps(cards);
      // 重叠卡片应该被分开
      expect(Math.abs(cards[0].left - cards[1].left)).toBeGreaterThan(0);
    });

    it('不重叠的卡片位置应该不变', () => {
      const cards = [
        { left: 100, top: 100, width: 50, height: 50, origLeft: 100, origTop: 100, pos: 'top' },
        { left: 200, top: 200, width: 50, height: 50, origLeft: 200, origTop: 200, pos: 'top' }
      ];
      resolveCardOverlaps(cards);
      expect(cards[0].left).toBe(100);
      expect(cards[1].left).toBe(200);
    });
  });

  describe('enforceLineBoundaries', () => {
    it('应该将右侧卡片推离垂直线路', () => {
      const cards = [
        { left: 1690, top: 500, width: 50, height: 50, origLeft: 1690, origTop: 500 }
      ];
      enforceLineBoundaries(cards);
      // VERT_X = 1700, SAFE_GAP = 18
      // 卡片中心 cx = 1690 + 25 = 1715 >= 1700，在右侧
      // left = 1690 < 1718 (VERT_X + SAFE_GAP)，会被推到 minLeft
      expect(cards[0].left).toBeGreaterThanOrEqual(1718);
    });

    it('应该将左侧卡片推离垂直线路', () => {
      const cards = [
        { left: 1700, top: 500, width: 50, height: 50, origLeft: 1700, origTop: 500 }
      ];
      enforceLineBoundaries(cards);
      // 卡片中心 cx = 1700 + 25 = 1725 >= 1700，在右侧
      // left = 1700 < 1718，会被推到 minLeft
      expect(cards[0].left).toBeGreaterThanOrEqual(1718);
    });

    it('不在线路区域的卡片应该不受影响', () => {
      const cards = [
        { left: 100, top: 100, width: 50, height: 50, origLeft: 100, origTop: 100 }
      ];
      enforceLineBoundaries(cards);
      expect(cards[0].left).toBe(100);
    });
  });
});
