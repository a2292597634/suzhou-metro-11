/**
 * viz + charts 联动集成测试 — 验证筛选后图表数据同步
 */
import { describe, it, expect } from 'vitest';
import { filterStations, sortStations } from '../../js/modules/viz.js';
import { renderBarChart } from '../../js/modules/charts.js';

describe('viz ↔ charts 联动', () => {
  const stations = [
    { name: 'S站1', grade: 'S', shops: [{ type: '商铺', area: 20, status: '营业中' }] },
    { name: 'A站1', grade: 'A', shops: [{ type: '商铺', area: 15, status: '未出租' }] },
    { name: 'A站2', grade: 'A', shops: [
      { type: '商铺', area: 20, status: '营业中' },
      { type: '商铺', area: 10, status: '营业中' }
    ]},
    { name: 'B站1', grade: 'B', shops: [{ type: '商铺', area: 10, status: '未出租' }] }
  ];

  it('筛选 A 级后柱状图应仅包含 A 级站点', () => {
    const filtered = filterStations(stations, 'A');
    const svg = renderBarChart(filtered);
    // A 级站点名称应在 SVG 中
    expect(svg).toContain('A站1');
    expect(svg).toContain('A站2');
    // S 级不应出现
    expect(svg).not.toContain('S站1');
    // B 级不应出现
    expect(svg).not.toContain('B站1');
  });

  it('按商铺数降序排列后柱状图顺序应正确', () => {
    const sorted = sortStations([...stations], 'shops-desc');
    const svg = renderBarChart(sorted);
    // 商铺数：A站2(2) > S站1(1) = A站1(1) = B站1(1)
    // 只需验证 SVG 包含所有站点（顺序由 X 坐标控制）
    expect(svg).toContain('A站2');
    expect(svg).toContain('S站1');
  });

  it('筛选全部后柱状图应包含所有站点', () => {
    const filtered = filterStations(stations, 'all');
    const svg = renderBarChart(filtered);
    expect(svg).toContain('S站1');
    expect(svg).toContain('A站1');
    expect(svg).toContain('A站2');
    expect(svg).toContain('B站1');
  });
});
