/**
 * SVG 图表引擎测试 —— js/modules/charts.js
 */
import { describe, it, expect, beforeEach } from 'vitest';

// 图表模块当前不存在，测试先写后实现（Red → Green → Refactor）

describe('SVG 图表引擎', () => {
  // 测试用站点数据
  const sampleStations = [
    { name: '测试站1', grade: 'A', shops: [
      { type: '商铺', area: 20, status: '营业中' },
      { type: '商铺', area: 10, status: '未出租' }
    ]},
    { name: '测试站2', grade: 'S', shops: [
      { type: '商铺', area: 30, status: '营业中' },
      { type: '商铺', area: 20, status: '营业中' }
    ]},
    { name: '测试站3', grade: 'B', shops: [
      { type: '商铺', area: 15, status: '未出租' }
    ]}
  ];

  // ============================================
  // renderBarChart — 出租率柱状图
  // ============================================
  describe('renderBarChart', () => {
    it('应返回包含 <svg> 标签的字符串', async () => {
      const { renderBarChart } = await import('../js/modules/charts.js');
      const result = renderBarChart(sampleStations);
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    });

    it('每个站点应渲染一根 <rect> 柱', async () => {
      const { renderBarChart } = await import('../js/modules/charts.js');
      const result = renderBarChart(sampleStations);
      // 3 个站点，每个一根柱
      const rectCount = (result.match(/<rect/g) || []).length;
      expect(rectCount).toBeGreaterThanOrEqual(3);
    });

    it('应包含图表标题"各站点出租率"', async () => {
      const { renderBarChart } = await import('../js/modules/charts.js');
      const result = renderBarChart(sampleStations);
      expect(result).toContain('各站点出租率');
    });

    it('应包含 Y 轴刻度标签', async () => {
      const { renderBarChart } = await import('../js/modules/charts.js');
      const result = renderBarChart(sampleStations);
      expect(result).toContain('0%');
      expect(result).toContain('50%');
      expect(result).toContain('100%');
    });

    it('空站点数组应返回"暂无数据"占位文字', async () => {
      const { renderBarChart } = await import('../js/modules/charts.js');
      const result = renderBarChart([]);
      expect(result).toContain('暂无数据');
    });

    it('单站点不应报错', async () => {
      const { renderBarChart } = await import('../js/modules/charts.js');
      const single = [{ name: '单站', grade: 'A', shops: [{ type: '商铺', area: 10, status: '营业中' }] }];
      expect(() => renderBarChart(single)).not.toThrow();
      expect(renderBarChart(single)).toContain('<svg');
    });

    it('柱颜色应按出租率阈值变化', async () => {
      const { renderBarChart } = await import('../js/modules/charts.js');
      // 100% 出租率 → 绿色
      const high = [{ name: '高', grade: 'S', shops: [{ type: '商铺', area: 10, status: '营业中' }] }];
      const highResult = renderBarChart(high);
      expect(highResult).toContain('#16a34a'); // fresh-green

      // 0% 出租率 → 红色
      const low = [{ name: '低', grade: 'C', shops: [{ type: '商铺', area: 10, status: '未出租' }] }];
      const lowResult = renderBarChart(low);
      expect(lowResult).toContain('#ef4444'); // red
    });
  });

  // ============================================
  // renderDonutChart — 分级占比环形图
  // ============================================
  describe('renderDonutChart', () => {
    it('应返回包含 <svg> 标签的字符串', async () => {
      const { renderDonutChart } = await import('../js/modules/charts.js');
      const gradeCount = { S: 3, A: 5, B: 7, C: 13 };
      const result = renderDonutChart(gradeCount);
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    });

    it('应包含 4 个扇区（path 元素）', async () => {
      const { renderDonutChart } = await import('../js/modules/charts.js');
      const gradeCount = { S: 3, A: 5, B: 7, C: 13 };
      const result = renderDonutChart(gradeCount);
      // 环形图每个扇区是一个 <path> 元素
      const pathCount = (result.match(/<path/g) || []).length;
      expect(pathCount).toBe(4);
    });

    it('中心应显示总站点数', async () => {
      const { renderDonutChart } = await import('../js/modules/charts.js');
      const gradeCount = { S: 3, A: 5, B: 7, C: 13 };
      const result = renderDonutChart(gradeCount);
      expect(result).toContain('28');
    });

    it('应包含图表标题"站点等级分布"', async () => {
      const { renderDonutChart } = await import('../js/modules/charts.js');
      const result = renderDonutChart({ S: 1 });
      expect(result).toContain('站点等级分布');
    });

    it('单一等级时应渲染完整圆环', async () => {
      const { renderDonutChart } = await import('../js/modules/charts.js');
      const gradeCount = { S: 10 };
      const result = renderDonutChart(gradeCount);
      expect(() => renderDonutChart(gradeCount)).not.toThrow();
      expect(result).toContain('<svg');
    });

    it('空数据应返回"暂无数据"', async () => {
      const { renderDonutChart } = await import('../js/modules/charts.js');
      const result = renderDonutChart({});
      expect(result).toContain('暂无数据');
    });
  });

  // ============================================
  // renderStatusChart — 经营状态分布图
  // ============================================
  describe('renderStatusChart', () => {
    it('应返回包含 <svg> 标签的字符串', async () => {
      const { renderStatusChart } = await import('../js/modules/charts.js');
      const result = renderStatusChart(sampleStations);
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });

    it('每个站点应有 3 根柱（营业中/未出租/装修中）', async () => {
      const { renderStatusChart } = await import('../js/modules/charts.js');
      const result = renderStatusChart(sampleStations);
      // 3 站点 × 3 种类别 = 9 根柱，加上可能的其他 rect（如图例等）
      const rectCount = (result.match(/<rect/g) || []).length;
      expect(rectCount).toBeGreaterThanOrEqual(9);
    });

    it('应包含图例', async () => {
      const { renderStatusChart } = await import('../js/modules/charts.js');
      const result = renderStatusChart(sampleStations);
      expect(result).toContain('营业中');
      expect(result).toContain('未出租');
      expect(result).toContain('装修中');
    });

    it('应包含图表标题', async () => {
      const { renderStatusChart } = await import('../js/modules/charts.js');
      const result = renderStatusChart(sampleStations);
      expect(result).toContain('经营状态');
    });

    it('空站点数组应返回"暂无数据"', async () => {
      const { renderStatusChart } = await import('../js/modules/charts.js');
      const result = renderStatusChart([]);
      expect(result).toContain('暂无数据');
    });
  });
});
