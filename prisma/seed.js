/**
 * 数据种子脚本 - 将默认数据导入 PostgreSQL
 * 运行: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const defaultData = require('../data/default-data.json');
const prisma = new PrismaClient();

function buildSeedShopUid(stationId, shop, index) {
  if (shop.shopUid) return shop.shopUid;
  const stableNo = shop.shortNo || shop.no || 'shop';
  const source = stationId + ':' + stableNo + ':' + index;
  return 'shop_' + crypto.createHash('sha256').update(source).digest('hex').slice(0, 24);
}

async function main() {
  // 检查是否强制覆盖（--force 参数）
  const forceReset = process.argv.includes('--force');

  if (!forceReset) {
    const stationCount = await prisma.station.count();
    if (stationCount > 0) {
      console.log(`数据库已有 ${stationCount} 个站点，跳过种子导入。`);
      console.log('如需强制覆盖，请使用: node prisma/seed.js --force');
      return;
    }
  } else {
    console.log('--force 模式：将覆盖已有数据');
    await prisma.shopPhoto.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.station.deleteMany();
    await prisma.globalStats.deleteMany();
    await prisma.gradeInfo.deleteMany();
  }

  console.log('开始导入默认数据（来自 data/default-data.json）...');

  // 1. 导入站点和商铺
  for (const s of defaultData.stations) {
    await prisma.station.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        grade: s.grade,
        x: s.x,
        y: s.y,
        pos: s.pos,
        transfer: s.transfer,
        transferLine: s.transferLine || null
      },
      create: {
        id: s.id,
        name: s.name,
        grade: s.grade,
        x: s.x,
        y: s.y,
        pos: s.pos,
        transfer: s.transfer,
        transferLine: s.transferLine || null,
        shops: {
          create: s.shops.map((shop, index) => ({
            shopUid: buildSeedShopUid(s.id, shop, index),
            no: shop.no,
            shortNo: shop.shortNo,
            name: shop.name,
            type: shop.type,
            area: shop.area,
            tenant: shop.tenant || '',
            contact: shop.contact || '',
            openDate: shop.openDate || '',
            status: shop.status,
            power: shop.power || '',
            water: shop.water || '/',
            remark: shop.remark || ''
          }))
        }
      }
    });
  }
  console.log(`✅ 已导入 ${defaultData.stations.length} 个站点`);

  // 2. 导入全局统计
  const gs = defaultData.globalStats;
  await prisma.globalStats.upsert({
    where: { id: 1 },
    update: {
      statsDate: gs.statsDate,
      totalShops: gs.totalShops,
      rentedShops: gs.rentedShops,
      vacantShops: gs.vacantShops,
      rentRate: gs.rentRate
    },
    create: {
      id: 1,
      statsDate: gs.statsDate,
      totalShops: gs.totalShops,
      rentedShops: gs.rentedShops,
      vacantShops: gs.vacantShops,
      rentRate: gs.rentRate
    }
  });
  console.log('✅ 已导入全局统计');

  // 3. 导入分级信息
  for (const [key, info] of Object.entries(defaultData.gradeInfo)) {
    await prisma.gradeInfo.upsert({
      where: { id: key },
      update: {
        name: info.name,
        desc: info.desc,
        color: info.color
      },
      create: {
        id: key,
        name: info.name,
        desc: info.desc,
        color: info.color
      }
    });
  }
  console.log('✅ 已导入商业价值分级');

  console.log('\n数据导入完成！');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = {
  buildSeedShopUid
};
