/**
 * Excel 导出引擎测试 — 模板生成、数据导出
 */
import { describe, it, expect } from 'vitest';

// 测试模板生成函数的输出结构
// 注：实际 ExcelJS workbook 的完整验证在集成测试中进行

describe('Excel 导出引擎', () => {
  describe('generateTemplate()', () => {
    it('应该生成包含 4 个 Sheet 的工作簿', async () => {
      const { generateTemplate } = await import('../tools/excel-export.js');
      const wb = generateTemplate();
      expect(wb.worksheets).toHaveLength(4);
    });

    it('Sheet 名称应该为商铺信息、站点信息、分级标准、填写说明', async () => {
      const { generateTemplate } = await import('../tools/excel-export.js');
      const wb = generateTemplate();
      const names = wb.worksheets.map(ws => ws.name);
      expect(names).toEqual(['商铺信息', '站点信息', '分级标准', '填写说明']);
    });

    it('商铺信息 Sheet 应该包含 10 列表头', async () => {
      const { generateTemplate } = await import('../tools/excel-export.js');
      const wb = generateTemplate();
      const shopWs = wb.getWorksheet('商铺信息');
      const headers = [];
      for (let i = 1; i <= 10; i++) {
        headers.push(shopWs.getCell(1, i).value);
      }
      expect(headers).toEqual([
        '车站', '简洁编号', '铺号', '类型', '面积(㎡)',
        '电量', '上下水', '状态', '商户', '备注'
      ]);
    });

    it('商铺信息 Sheet 表头应该有加粗样式', async () => {
      const { generateTemplate } = await import('../tools/excel-export.js');
      const wb = generateTemplate();
      const shopWs = wb.getWorksheet('商铺信息');
      expect(shopWs.getCell(1, 1).style.font.bold).toBe(true);
    });

    it('站点信息 Sheet 应该包含 3 列表头', async () => {
      const { generateTemplate } = await import('../tools/excel-export.js');
      const wb = generateTemplate();
      const ws = wb.getWorksheet('站点信息');
      expect(ws.getCell(1, 1).value).toBe('站点ID');
      expect(ws.getCell(1, 2).value).toBe('站点名称');
      expect(ws.getCell(1, 3).value).toBe('等级');
    });

    it('分级标准 Sheet 应该包含 4 列表头', async () => {
      const { generateTemplate } = await import('../tools/excel-export.js');
      const wb = generateTemplate();
      const ws = wb.getWorksheet('分级标准');
      expect(ws.getCell(1, 1).value).toBe('等级ID');
      expect(ws.getCell(1, 2).value).toBe('等级名称');
      expect(ws.getCell(1, 3).value).toBe('说明');
      expect(ws.getCell(1, 4).value).toBe('颜色');
    });
  });

  describe('generateExport()', () => {
    const mockStations = [
      {
        id: 'weiting', name: '唯亭站', grade: 'B',
        shops: [
          { shortNo: 'S11-1', name: 'A商铺', type: '商铺', area: 18.69, power: '', water: '/', status: '未出租', tenant: '', remark: '' }
        ]
      },
      {
        id: 'huaqiao', name: '花桥站', grade: 'S',
        shops: [
          { shortNo: '待定', name: 'A号商铺', type: '商铺', area: 19.81, power: '', water: '/', status: '营业中', tenant: '蜜雪冰城', remark: '上海花桥站' }
        ]
      }
    ];

    const mockGradeInfo = {
      'S': { name: 'S级', desc: '', color: '#d4380d' },
      'A': { name: 'A级', desc: '', color: '#fa8c16' }
    };

    it('应该生成包含 3 个 Sheet 的工作簿', async () => {
      const { generateExport } = await import('../tools/excel-export.js');
      const wb = generateExport(mockStations, null, mockGradeInfo);
      expect(wb.worksheets).toHaveLength(3);
      expect(wb.worksheets.map(ws => ws.name)).toContain('商铺信息');
      expect(wb.worksheets.map(ws => ws.name)).toContain('站点信息');
      expect(wb.worksheets.map(ws => ws.name)).toContain('分级标准');
    });

    it('商铺信息 Sheet 应该包含所有商铺行', async () => {
      const { generateExport } = await import('../tools/excel-export.js');
      const wb = generateExport(mockStations, null, mockGradeInfo);
      const shopWs = wb.getWorksheet('商铺信息');
      // 第 1 行表头 + 2 行数据
      expect(shopWs.getCell(2, 1).value).toBe('唯亭站');
      expect(shopWs.getCell(3, 1).value).toBe('花桥站');
    });

    it('导出应该包含花桥站数据', async () => {
      const { generateExport } = await import('../tools/excel-export.js');
      const wb = generateExport(mockStations, null, mockGradeInfo);
      const shopWs = wb.getWorksheet('商铺信息');
      const huaqiaoRow = shopWs.getCell(3, 1).value;
      expect(huaqiaoRow).toBe('花桥站');
    });

    it('站点信息 Sheet 应该包含所有站点行', async () => {
      const { generateExport } = await import('../tools/excel-export.js');
      const wb = generateExport(mockStations, null, mockGradeInfo);
      const stationWs = wb.getWorksheet('站点信息');
      expect(stationWs.getCell(2, 1).value).toBe('weiting');
      expect(stationWs.getCell(3, 1).value).toBe('huaqiao');
    });
  });
});
