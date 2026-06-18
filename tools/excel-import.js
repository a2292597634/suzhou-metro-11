/**
 * Excel 导入引擎 — 解析、校验、写入数据库
 *
 * 用法:
 *   CLI:  node tools/excel-import.js <文件路径>
 *   API:  const { importExcel } = require('./tools/excel-import');
 */

const ExcelJS = require('exceljs');

// 状态值映射（容错）
const STATUS_MAP = {
  '已租': '营业中', '已开业': '营业中', '营业': '营业中',
  '未租': '未出租', '': '未出租',
  '装修': '装修中',
  '营业中': '营业中', '未出租': '未出租', '装修中': '装修中'
};

const VALID_STATUS = ['营业中', '未出租', '装修中'];
const VALID_POWER = ['20KW', '30KW', ''];
const VALID_WATER = ['有', '/', ''];

/**
 * 解析并导入 Excel 文件
 * @param {string} filePath Excel 文件路径
 * @param {object} prisma PrismaClient 实例
 * @returns {object} 导入报告 { success, summary: { created, updated, skipped, errors }, errors: [...] }
 */
async function importExcel(filePath, prisma) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const shopWs = wb.getWorksheet('商铺信息');
  if (!shopWs) {
    return { success: false, error: '缺少「商铺信息」Sheet', summary: null, errors: [] };
  }

  // 解析所有行
  const rows = [];
  let currentStation = null;
  let rowNum = 0;

  shopWs.eachRow((row, num) => {
    if (num === 1) return; // 跳过表头
    rowNum = num;

    const vals = [];
    for (let i = 1; i <= 10; i++) {
      vals.push(row.getCell(i).value);
    }

    const stationCol = vals[0] ? String(vals[0]).trim() : '';
    const shortNo = vals[1] ? String(vals[1]).trim() : '';
    const shopName = vals[2] ? String(vals[2]).trim() : '';
    const type = vals[3] ? String(vals[3]).trim() : '商铺';
    const area = parseFloat(vals[4]) || 0;
    const power = vals[5] ? String(vals[5]).trim().toUpperCase() : '';
    const water = vals[6] ? String(vals[6]).trim() : '/';
    const statusRaw = vals[7] ? String(vals[7]).trim() : '';
    const tenant = vals[8] ? String(vals[8]).trim() : '';
    const remark = vals[9] ? String(vals[9]).trim() : '';

    // 前向填充车站名
    const stationName = stationCol || currentStation;
    if (stationCol) currentStation = stationCol;

    // 跳过空行
    if (!shortNo) return;

    rows.push({ rowNum: num, stationName, shortNo, shopName, type, area, power, water, statusRaw, tenant, remark });
  });

  if (rows.length === 0) {
    return { success: false, error: 'Excel 中没有有效数据行', summary: null, errors: [] };
  }

  // 预加载所有站点和商铺
  const allStations = await prisma.station.findMany({ include: { shops: true } });
  const stationMap = {};
  for (const s of allStations) {
    stationMap[s.name] = s;
  }

  // 逐行校验
  const errors = [];
  const validRows = [];

  for (const r of rows) {
    const rowErrors = [];
    const station = stationMap[r.stationName];
    if (!station) {
      rowErrors.push({ field: '车站', message: `车站「${r.stationName}」不存在` });
    }
    if (!r.shortNo) {
      rowErrors.push({ field: '简洁编号', message: '简洁编号不能为空' });
    }
    if (!r.shopName) {
      rowErrors.push({ field: '铺号', message: '铺号不能为空' });
    }
    if (isNaN(r.area) || r.area < 0) {
      rowErrors.push({ field: '面积', message: '面积必须是正数' });
    }

    // 映射状态值
    const mappedStatus = STATUS_MAP[r.statusRaw];
    if (!mappedStatus) {
      rowErrors.push({ field: '状态', message: `状态值「${r.statusRaw}」无效，允许：营业中、未出租、装修中` });
    }
    if (r.power && !VALID_POWER.includes(r.power)) {
      rowErrors.push({ field: '电量', message: `电量值「${r.power}」无效，允许：20KW、30KW` });
    }
    if (r.water && !['有', '/'].includes(r.water)) {
      rowErrors.push({ field: '上下水', message: `上下水值「${r.water}」无效，允许：有、/` });
    }

    if (rowErrors.length > 0) {
      errors.push({ row: r.rowNum, errors: rowErrors });
    } else {
      validRows.push({ ...r, status: mappedStatus, station });
    }
  }

  // 事务写入
  let created = 0, updated = 0;
  try {
    await prisma.$transaction(async (tx) => {
      for (const r of validRows) {
        const existingShop = r.station.shops.find(sh => sh.shortNo === r.shortNo);
        if (existingShop) {
          await tx.shop.update({
            where: { id: existingShop.id },
            data: {
              name: r.shopName,
              type: r.type,
              area: r.area,
              power: r.power,
              water: r.water,
              status: r.status,
              tenant: r.tenant,
              remark: r.remark
            }
          });
          updated++;
        } else {
          // 计算新商铺的 no 序号
          const maxNo = r.station.shops.length > 0
            ? Math.max(...r.station.shops.map(s => s.no))
            : 0;
          await tx.shop.create({
            data: {
              no: maxNo + 1,
              shortNo: r.shortNo,
              name: r.shopName,
              type: r.type,
              area: r.area,
              power: r.power,
              water: r.water,
              status: r.status,
              tenant: r.tenant,
              remark: r.remark,
              stationId: r.station.id
            }
          });
          created++;
        }
      }

      // 导入后重算 GlobalStats
      const allShops = await tx.shop.findMany();
      const totalShops = allShops.length;
      const rentedShops = allShops.filter(s => s.status === '营业中').length;
      const vacantShops = totalShops - rentedShops;
      const rentRate = totalShops > 0 ? (rentedShops / totalShops * 100).toFixed(1) + '%' : '0%';

      await tx.globalStats.upsert({
        where: { id: 1 },
        update: { totalShops, rentedShops, vacantShops, rentRate, statsDate: new Date().toLocaleDateString('zh-CN') },
        create: { id: 1, statsDate: new Date().toLocaleDateString('zh-CN'), totalShops, rentedShops, vacantShops, rentRate }
      });
    });

    return {
      success: true,
      summary: { created, updated, skipped: errors.length, errors: errors.length },
      errors
    };
  } catch (err) {
    return { success: false, error: '数据库写入失败：' + err.message, summary: null, errors };
  }
}

// CLI 模式
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('用法: node tools/excel-import.js <文件路径>');
    process.exit(1);
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  importExcel(filePath, prisma)
    .then(result => {
      if (result.success) {
        console.log('✅ 导入成功');
        console.log(`  新增: ${result.summary.created}, 更新: ${result.summary.updated}`);
        if (result.summary.errors > 0) {
          console.log(`  错误: ${result.summary.errors} 行`);
          result.errors.forEach(e => {
            console.log(`  行 ${e.row}:`, e.errors.map(er => er.message).join(', '));
          });
        }
      } else {
        console.error('❌ 导入失败:', result.error);
      }
      return prisma.$disconnect();
    })
    .catch(e => { console.error(e); process.exit(1); });
}

module.exports = { importExcel };
