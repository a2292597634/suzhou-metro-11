/**
 * 一次性数据初始化 — 从运营方 Excel 导入电量/上下水/商户/状态更新
 * 运行: node tools/init-from-excel.js
 */

const ExcelJS = require('exceljs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// === 配置 ===
const EXCEL_PATH = path.join(__dirname, '..', '..', 'suzhou-metro-11 数据表格', '副本11号线地铁商铺开业情况2026.6.4.xlsx');

// 车站等级映射（一类→A, 二类→B, 三类→C）
const GRADE_MAP = { '一类': 'A', '二类': 'B', '三类': 'C' };

// 状态映射
const STATUS_MAP = { '已租': '营业中', '': '未出租' };

async function main() {
  console.log('读取运营方 Excel:', EXCEL_PATH);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);

  const ws = wb.getWorksheet('商铺');
  if (!ws) { console.error('找不到「商铺」Sheet'); process.exit(1); }

  // 解析 Excel 数据
  const excelShops = [];
  let currentSection = '一类';
  let currentStation = null;

  ws.eachRow((row, num) => {
    if (num <= 2) return; // 跳过标题和表头行
    const col0 = row.getCell(1).value ? String(row.getCell(1).value).trim() : '';
    if (col0 === '二类') { currentSection = '二类'; return; }
    if (col0 === '三类') { currentSection = '三类'; return; }
    if (!col0 || col0 === '等级') return;

    const stationCol = row.getCell(3).value ? String(row.getCell(3).value).trim() : '';
    const shortNo = row.getCell(4).value ? String(row.getCell(4).value).trim() : '';
    if (!shortNo) return;
    if (stationCol) currentStation = stationCol;

    excelShops.push({
      section: currentSection,
      station: currentStation,
      shortNo,
      shopName: row.getCell(5).value ? String(row.getCell(5).value).trim() : '',
      area: parseFloat(row.getCell(6).value) || 0,
      power: row.getCell(7).value ? String(row.getCell(7).value).trim().toUpperCase() : '',
      water: row.getCell(8).value ? String(row.getCell(8).value).trim() : '/',
      status: STATUS_MAP[row.getCell(9).value ? String(row.getCell(9).value).trim() : ''] || '未出租',
      tenant: row.getCell(10).value ? String(row.getCell(10).value).trim() : ''
    });
  });

  console.log(`解析到 ${excelShops.length} 条商铺`);

  // 加载 DB 数据
  const dbStations = await prisma.station.findMany({ include: { shops: true } });
  const stationMap = {};
  dbStations.forEach(s => { stationMap[s.name] = s; });

  // 统计
  let powerUpdated = 0, gradeUpdated = 0, tenantUpdated = 0, statusUpdated = 0;

  await prisma.$transaction(async (tx) => {
    // 1. 更新商铺数据
    for (const e of excelShops) {
      const station = stationMap[e.station];
      if (!station) { console.log(`  ⚠️ 车站不存在: ${e.station}`); continue; }

      const shop = station.shops.find(s => s.shortNo === e.shortNo);
      if (!shop) { console.log(`  ⚠️ 商铺不存在: ${e.station} / ${e.shortNo}`); continue; }

      const updates = {};
      if (e.power) { updates.power = e.power; powerUpdated++; }
      if (e.water && e.water !== '/') { updates.water = e.water; }
      if (e.tenant && e.tenant !== shop.tenant) { updates.tenant = e.tenant; tenantUpdated++; }
      if (e.status && e.status !== shop.status) { updates.status = e.status; statusUpdated++; }

      if (Object.keys(updates).length > 0) {
        await tx.shop.update({ where: { id: shop.id }, data: updates });
      }
    }

    // 2. 新增 S11-42（夏驾河公园站）
    const xiajiahe = stationMap['夏驾河公园站'];
    if (xiajiahe && !xiajiahe.shops.find(s => s.shortNo === 'S11-42')) {
      const maxNo = Math.max(...xiajiahe.shops.map(s => s.no));
      await tx.shop.create({
        data: {
          no: maxNo + 1, shortNo: 'S11-42',
          name: 'B商铺', type: '商铺', area: 29.95,
          power: '30KW', water: '/', status: '营业中',
          tenant: '牙博士', remark: '',
          stationId: xiajiahe.id
        }
      });
      console.log('  ✅ 新增 S11-42（夏驾河公园站）');
    }

    // 3. 更新站点等级
    const stationGrades = {};
    excelShops.forEach(e => {
      if (!stationGrades[e.station]) stationGrades[e.station] = e.section;
    });
    for (const [name, section] of Object.entries(stationGrades)) {
      const newGrade = GRADE_MAP[section];
      if (!newGrade) continue;
      const st = stationMap[name];
      if (st && st.grade !== newGrade) {
        await tx.station.update({ where: { id: st.id }, data: { grade: newGrade } });
        gradeUpdated++;
        console.log(`  ✅ ${name}: ${st.grade} → ${newGrade}`);
      }
    }

    // 4. 重算 GlobalStats
    const allShops = await tx.shop.findMany();
    const total = allShops.length;
    const rented = allShops.filter(s => s.status === '营业中').length;
    await tx.globalStats.upsert({
      where: { id: 1 },
      update: { totalShops: total, rentedShops: rented, vacantShops: total - rented, rentRate: total > 0 ? (rented / total * 100).toFixed(1) + '%' : '0%' },
      create: { id: 1, statsDate: new Date().toLocaleDateString('zh-CN'), totalShops: total, rentedShops: rented, vacantShops: total - rented, rentRate: total > 0 ? (rented / total * 100).toFixed(1) + '%' : '0%' }
    });
  });

  console.log('\n✅ 初始化完成:');
  console.log(`  电量更新: ${powerUpdated} 条`);
  console.log(`  商户更新: ${tenantUpdated} 条`);
  console.log(`  状态更新: ${statusUpdated} 条`);
  console.log(`  等级更新: ${gradeUpdated} 站`);
  console.log('  新增 S11-42: 1 条');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
