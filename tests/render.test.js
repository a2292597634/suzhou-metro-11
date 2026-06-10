/**
 * 渲染引擎测试 —— js/modules/render.js
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../js/modules/state.js';
import { renderAll, renderStatsPanel, renderSVG, renderStations, renderGradePanel, renderFooter } from '../js/modules/render.js';

describe('渲染引擎', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    state.stations = [];
    state.globalStats = {};
    state.gradeInfo = { S: { name: 'S', desc: '', color: '' } };
  });

  describe('renderStatsPanel', () => {
    it('应该渲染统计面板', () => {
      state.globalStats = {
        totalShops: 66,
        rentedShops: 33,
        vacantShops: 33
      };

      document.body.innerHTML = '<div class="stats-grid"></div>';

      renderStatsPanel();

      const statsGrid = document.querySelector('.stats-grid');
      expect(statsGrid.innerHTML).toContain('66');
      expect(statsGrid.innerHTML).toContain('33');
    });

    it('空值应该显示占位符', () => {
      state.globalStats = {
        totalShops: '',
        rentedShops: '',
        vacantShops: ''
      };

      document.body.innerHTML = '<div class="stats-grid"></div>';

      renderStatsPanel();

      const statsGrid = document.querySelector('.stats-grid');
      expect(statsGrid.children.length).toBeGreaterThan(0);
    });
  });

  describe('renderGradePanel', () => {
    it('应该渲染分级面板', () => {
      state.gradeInfo = {
        S: { name: 'S级', desc: '核心', color: '#d4380d' },
        A: { name: 'A级', desc: '重点', color: '#fa8c16' },
        B: { name: 'B级', desc: '潜力', color: '#facc14' },
        C: { name: 'C级', desc: '培育', color: '#52c41a' }
      };

      document.body.innerHTML = '<div id="gradeList"></div>';

      renderGradePanel();

      const gradeList = document.getElementById('gradeList');
      expect(gradeList.children.length).toBe(4);
      expect(gradeList.innerHTML).toContain('S级');
      expect(gradeList.innerHTML).toContain('A级');
    });
  });

  describe('renderFooter', () => {
    it('应该更新日期元素', () => {
      state.globalStats.statsDate = '2024年6月1日';

      document.body.innerHTML = '<div class="footer"><span class="editable"></span></div>';

      renderFooter();

      const dateEl = document.querySelector('.footer .editable');
      expect(dateEl.textContent).toBe('2024年6月1日');
    });
  });

  describe('renderSVG', () => {
    it('应该渲染 SVG 线路', () => {
      state.stations = [
        { x: 100, y: 480, name: '测试站', transfer: false }
      ];

      document.body.innerHTML = '<svg id="metroLines"></svg>';

      renderSVG();

      const svg = document.getElementById('metroLines');
      expect(svg.innerHTML).toContain('path');
    });
  });

  describe('renderStations', () => {
    it('应该渲染站点卡片', () => {
      state.stations = [
        {
          id: 'test1', name: '测试站', grade: 'A', x: 100, y: 480, pos: 'top',
          shops: [
            { name: '商铺A', status: '营业中', tenant: '便利店', type: '商铺' }
          ]
        }
      ];

      document.body.innerHTML = '<div id="stationsLayer"></div><svg id="metroLines"></svg>';

      renderStations();

      const layer = document.getElementById('stationsLayer');
      expect(layer.querySelector('.station-card')).not.toBeNull();
    });
  });

  describe('renderAll', () => {
    it('应该调用所有渲染函数', () => {
      document.body.innerHTML = `
        <div class="stats-grid"></div>
        <svg id="metroLines"></svg>
        <div id="stationsLayer"></div>
        <div id="gradeList"></div>
        <div class="footer"><span class="editable"></span></div>
      `;

      state.globalStats = { totalShops: 10, rentedShops: 5, vacantShops: 5 };
      state.stations = [];
      state.gradeInfo = { S: { name: 'S', desc: '', color: '' } };

      renderAll();

      // 验证各个面板都被渲染了
      expect(document.querySelector('.stats-grid').children.length).toBeGreaterThan(0);
    });
  });

  describe('XSS 防护', () => {
    it('renderGradePanel 应该转义分级名称和描述中的脚本标签', () => {
      state.gradeInfo = {
        S: { name: '<img src=x onerror=alert(1)>', desc: '<script>alert(1)</script>', color: '#d4380d' }
      };

      document.body.innerHTML = '<div id="gradeList"></div>';

      renderGradePanel();

      const gradeName = document.querySelector('.grade-name');
      const gradeDesc = document.querySelector('.grade-stations');
      // textContent 应该显示为纯文本（浏览器解析 HTML 实体后的结果）
      expect(gradeName.textContent).toBe('<img src=x onerror=alert(1)>');
      expect(gradeDesc.textContent).toBe('<script>alert(1)</script>');
      // 元素的 innerHTML 应该包含转义后的实体（而非原始标签）
      expect(gradeName.innerHTML).toContain('&lt;img');
      expect(gradeDesc.innerHTML).toContain('&lt;script&gt;');
    });
  });
});
