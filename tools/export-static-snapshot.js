/**
 * 静态快照导出脚本
 * 从 PostgreSQL 导出 GitHub Pages 可直接读取的数据与商铺照片资产。
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const PHOTO_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function getStaticPhotoExtension(mimeType) {
  const ext = PHOTO_EXTENSIONS[mimeType];
  if (!ext) throw new Error(`不支持的照片 MIME 类型: ${mimeType}`);
  return ext;
}

function stableJsonHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function ensureCleanPhotoDir(photoDir) {
  await fs.mkdir(photoDir, { recursive: true });
  const entries = await fs.readdir(photoDir, { withFileTypes: true });
  await Promise.all(entries
    .filter(entry => entry.isFile())
    .map(entry => fs.unlink(path.join(photoDir, entry.name))));
}

function formatShop(shop, photoPath = '', photoHash = '') {
  return {
    shopUid: shop.shopUid,
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
    remark: shop.remark || '',
    photo: photoPath,
    photoHash
  };
}

function formatStation(station, shops) {
  return {
    id: station.id,
    name: station.name,
    grade: station.grade,
    x: station.x,
    y: station.y,
    pos: station.pos,
    transfer: station.transfer,
    version: station.version,
    transferLine: station.transferLine,
    shops
  };
}

async function exportStaticSnapshot(options = {}) {
  const prisma = options.prisma || new PrismaClient();
  const ownsPrisma = !options.prisma;
  const outputRoot = options.outputRoot || path.resolve(__dirname, '..');
  const generatedAt = options.generatedAt || new Date();
  const generatedAtIso = generatedAt.toISOString();
  const dataDir = path.join(outputRoot, 'data');
  const photoDir = path.join(outputRoot, 'assets', 'shop-photos');

  try {
    await fs.mkdir(dataDir, { recursive: true });
    await ensureCleanPhotoDir(photoDir);

    const [stations, globalStats, gradeInfos] = await Promise.all([
      prisma.station.findMany({
        include: {
          shops: {
            include: { photo: true },
            orderBy: { no: 'asc' }
          }
        },
        orderBy: { x: 'asc' }
      }),
      prisma.globalStats.findUnique({ where: { id: 1 } }),
      prisma.gradeInfo.findMany()
    ]);

    const photos = [];
    const formattedStations = [];

    for (const station of stations) {
      const shops = [];
      for (const shop of station.shops) {
        if (!shop.photo) {
          shops.push(formatShop(shop));
          continue;
        }

        const ext = getStaticPhotoExtension(shop.photo.mimeType);
        const fileName = `${shop.shopUid}-${shop.photo.sha256.slice(0, 12)}.${ext}`;
        const staticPath = `/assets/shop-photos/${fileName}`;
        await fs.writeFile(path.join(photoDir, fileName), Buffer.from(shop.photo.content));

        photos.push({
          shopUid: shop.shopUid,
          sha256: shop.photo.sha256,
          path: staticPath,
          mimeType: shop.photo.mimeType,
          byteSize: shop.photo.byteSize
        });
        shops.push(formatShop(shop, staticPath, shop.photo.sha256));
      }
      formattedStations.push(formatStation(station, shops));
    }

    const gradeInfo = {};
    for (const info of gradeInfos) {
      gradeInfo[info.id] = { name: info.name, desc: info.desc || '', color: info.color };
    }

    const dataWithoutSnapshot = {
      stations: formattedStations,
      globalStats: globalStats || null,
      gradeInfo
    };
    const dataHash = stableJsonHash(dataWithoutSnapshot);
    const snapshotId = `${generatedAtIso}-${dataHash.slice(0, 12)}`;
    const defaultData = { snapshotId, ...dataWithoutSnapshot };
    const manifest = {
      snapshotId,
      generatedAt: generatedAtIso,
      dataHash,
      photoCount: photos.length,
      photos
    };

    await fs.writeFile(path.join(dataDir, 'default-data.json'), `${JSON.stringify(defaultData, null, 2)}\n`, 'utf8');
    await fs.writeFile(path.join(dataDir, 'static-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    return manifest;
  } finally {
    if (ownsPrisma) await prisma.$disconnect();
  }
}

async function main() {
  const manifest = await exportStaticSnapshot();
  console.log(`静态快照已导出: ${manifest.snapshotId}`);
  console.log(`照片数量: ${manifest.photoCount}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('静态快照导出失败:', err.message);
    process.exit(1);
  });
}

module.exports = {
  exportStaticSnapshot,
  getStaticPhotoExtension
};