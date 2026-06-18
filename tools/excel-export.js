/**
 * Excel 导出引擎 — 模板生成、全量数据导出
 *
 * 用法:
 *   CLI:  node tools/excel-export.js
 *   API:  const { generateTemplate, generateExport } = require('./tools/excel-export');
 */

const ExcelJS = require('exceljs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const ALL_STATIONS = [
  '唯亭站', '草鞋山站', '阳澄湖东站', '正仪站', '莲湖公园站', '祖冲之公园站',
  '昆山文化艺术中心站', '共青站', '江浦站', '白马泾路站', '玉山广场站', '绣衣站',
  '昆山城市广场站', '金浦大桥东站', '顺帆北路站', '鱼池泾站', '白河潭站', '兵希站',
  '夏驾河公园站', '盛庄站', '章基路南站', '夏桥站', '神童泾站', '菉葭站',
  '花桥博览中心站', '集善站', '花溪公园站', '花桥站'
];

// 表头样式
const headerStyle = {
  font: { bold: true, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } },
  alignment: { horizontal: 'center', vertical: 'middle' }
};

/**
 * 生成空白模板（4 个 Sheet）
 */
function generateTemplate() {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: 商铺信息
  const shopWs = wb.addWorksheet('商铺信息');
  const shopHeaders = ['车站', '简洁编号', '铺号', '类型', '面积(㎡)', '电量', '上下水', '状态', '商户', '备注'];
  const shopColWidths = [16, 12, 28, 10, 10, 8, 8, 10, 20, 24];

  shopHeaders.forEach((h, i) => {
    const cell = shopWs.getCell(1, i + 1);
    cell.value = h;
    cell.style = { ...headerStyle, border: true };
    shopWs.getColumn(i + 1).width = shopColWidths[i];
  });

  // 下拉验证
  shopWs.getColumn(1).eachCell({ includeEmpty: true }, (cell, rowNum) => {
    if (rowNum > 1) {
      cell.dataValidation = {
        type: 'list', allowBlank: true, formulae: [`"${ALL_STATIONS.join(',')}"`]
      };
    }
  });
  shopWs.getColumn(4).eachCell({ includeEmpty: true }, (cell, rowNum) => {
    if (rowNum > 1) cell.dataValidation = { type: 'list', allowBlank: true, formulae: ['"商铺,多经点位"'] };
  });
  shopWs.getColumn(6).eachCell({ includeEmpty: true }, (cell, rowNum) => {
    if (rowNum > 1) cell.dataValidation = { type: 'list', allowBlank: true, formulae: ['"20KW,30KW"'] };
  });
  shopWs.getColumn(7).eachCell({ includeEmpty: true }, (cell, rowNum) => {
    if (rowNum > 1) cell.dataValidation = { type: 'list', allowBlank: true, formulae: ['"有,/"'] };
  });
  shopWs.getColumn(8).eachCell({ includeEmpty: true }, (cell, rowNum) => {
    if (rowNum > 1) cell.dataValidation = { type: 'list', allowBlank: true, formulae: ['"营业中,未出租,装修中"'] };
  });

  shopWs.views = [{ state: 'frozen', ySplit: 1 }];

  // Sheet 2: 站点信息
  const stationWs = wb.addWorksheet('站点信息');
  const stationHeaders = ['站点ID', '站点名称', '等级'];
  stationHeaders.forEach((h, i) => {
    const cell = stationWs.getCell(1, i + 1);
    cell.value = h;
    cell.style = { ...headerStyle, border: true };
  });
  stationWs.getColumn(1).width = 20;
  stationWs.getColumn(2).width = 18;
  stationWs.getColumn(3).width = 6;
  stationWs.getColumn(1).eachCell({ includeEmpty: true }, (cell, rowNum) => {
    if (rowNum > 1) cell.protection = { locked: true };
  });
  stationWs.getColumn(2).eachCell({ includeEmpty: true }, (cell, rowNum) => {
    if (rowNum > 1) cell.protection = { locked: true };
  });
  stationWs.getColumn(3).eachCell({ includeEmpty: true }, (cell, rowNum) => {
    if (rowNum > 1) cell.dataValidation = { type: 'list', allowBlank: true, formulae: ['"S,A,B,C"'] };
  });
  stationWs.views = [{ state: 'frozen', ySplit: 1 }];

  // Sheet 3: 分级标准
  const gradeWs = wb.addWorksheet('分级标准');
  const gradeHeaders = ['等级ID', '等级名称', '说明', '颜色'];
  gradeHeaders.forEach((h, i) => {
    const cell = gradeWs.getCell(1, i + 1);
    cell.value = h;
    cell.style = { ...headerStyle, border: true };
  });
  gradeWs.getColumn(1).width = 6;
  gradeWs.getColumn(2).width = 28;
  gradeWs.getColumn(3).width = 30;
  gradeWs.getColumn(4).width = 10;
  gradeWs.views = [{ state: 'frozen', ySplit: 1 }];

  // Sheet 4: 填写说明
  const helpWs = wb.addWorksheet('填写说明');
  helpWs.getColumn(1).width = 60;
  const instructions = [
    '苏州地铁11号线商业数据 Excel 导入模板 — 填写说明',
    '',
    '【商铺信息 Sheet】',
    '- 车站：从下拉列表中选择，必填',
    '- 简洁编号：商铺简短编号如 S11-1，必填，导入时作为匹配键',
    '- 铺号：商铺名称，必填',
    '- 类型：商铺 或 多经点位，默认为商铺',
    '- 面积(㎡)：商铺面积，必填数字',
    '- 电量：20KW 或 30KW',
    '- 上下水：有 或 / (无)',
    '- 状态：营业中、未出租、装修中',
    '- 商户：当前入驻商户名称',
    '- 备注：补充说明',
    '',
    '【站点信息 Sheet】',
    '- 站点ID 和 站点名称 不可修改',
    '- 仅等级列可编辑：S / A / B / C',
    '',
    '【分级标准 Sheet】',
    '- 可编辑等级名称和颜色',
    '',
    '⚠️ 注意：导入时按「车站名 + 简洁编号」匹配已有商铺进行更新，不会删除数据库中已有的商铺。'
  ];
  instructions.forEach((line, i) => {
    helpWs.getCell(i + 1, 1).value = line;
  });

  return wb;
}

/**
 * 生成全量数据导出（3 个 Sheet，含所有数据）
 */
function generateExport(stations, globalStats, gradeInfo) {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: 商铺信息
  const shopWs = wb.addWorksheet('商铺信息');
  const shopHeaders = ['车站', '简洁编号', '铺号', '类型', '面积(㎡)', '电量', '上下水', '状态', '商户', '备注'];
  shopHeaders.forEach((h, i) => {
    shopWs.getCell(1, i + 1).value = h;
    shopWs.getCell(1, i + 1).style = headerStyle;
  });

  stations.forEach(s => {
    (s.shops || []).forEach(shop => {
      shopWs.addRow([
        s.name, shop.shortNo || '', shop.name || '', shop.type || '商铺',
        shop.area || 0, shop.power || '', shop.water || '/',
        shop.status || '未出租', shop.tenant || '', shop.remark || ''
      ]);
    });
  });

  shopWs.getColumn(1).width = 16;
  shopWs.getColumn(2).width = 12;
  shopWs.getColumn(3).width = 28;
  shopWs.getColumn(4).width = 10;
  shopWs.getColumn(5).width = 10;
  shopWs.getColumn(6).width = 8;
  shopWs.getColumn(7).width = 8;
  shopWs.getColumn(8).width = 10;
  shopWs.getColumn(9).width = 20;
  shopWs.getColumn(10).width = 24;
  shopWs.views = [{ state: 'frozen', ySplit: 1 }];

  // Sheet 2: 站点信息
  const stationWs = wb.addWorksheet('站点信息');
  ['站点ID', '站点名称', '等级'].forEach((h, i) => {
    stationWs.getCell(1, i + 1).value = h;
    stationWs.getCell(1, i + 1).style = headerStyle;
  });
  stations.forEach(s => {
    stationWs.addRow([s.id, s.name, s.grade]);
  });
  stationWs.getColumn(1).width = 20;
  stationWs.getColumn(2).width = 18;
  stationWs.getColumn(3).width = 6;
  stationWs.views = [{ state: 'frozen', ySplit: 1 }];

  // Sheet 3: 分级标准
  const gradeWs = wb.addWorksheet('分级标准');
  ['等级ID', '等级名称', '说明', '颜色'].forEach((h, i) => {
    gradeWs.getCell(1, i + 1).value = h;
    gradeWs.getCell(1, i + 1).style = headerStyle;
  });
  if (gradeInfo) {
    Object.entries(gradeInfo).forEach(([key, info]) => {
      gradeWs.addRow([key, info.name, info.desc || '', info.color]);
    });
  }
  gradeWs.getColumn(1).width = 6;
  gradeWs.getColumn(2).width = 28;
  gradeWs.getColumn(3).width = 30;
  gradeWs.getColumn(4).width = 10;
  gradeWs.views = [{ state: 'frozen', ySplit: 1 }];

  return wb;
}

// CLI 模式
if (require.main === module) {
  const fs = require('fs');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  (async () => {
    console.log('导出全量数据...');
    const stations = await prisma.station.findMany({ include: { shops: true }, orderBy: { x: 'asc' } });
    const globalStats = await prisma.globalStats.findUnique({ where: { id: 1 } });
    const gradeInfos = await prisma.gradeInfo.findMany();
    const gradeInfo = {};
    gradeInfos.forEach(g => { gradeInfo[g.id] = { name: g.name, desc: g.desc || '', color: g.color }; });

    const wb = generateExport(stations, globalStats, gradeInfo);

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const filepath = path.join(OUTPUT_DIR, `轨道交通11号线商铺信息表_${new Date().toISOString().slice(0, 10)}.xlsx`);
    await wb.xlsx.writeFile(filepath);
    console.log(`✅ 已导出: ${filepath}`);
    await prisma.$disconnect();
  })().catch(e => { console.error(e); process.exit(1); });
}

module.exports = { generateTemplate, generateExport };
