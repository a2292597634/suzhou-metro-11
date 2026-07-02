/**
 * Import normalized shop photos from a local directory into ShopPhoto.
 * File names must start with the shop shortNo, for example:
 * S11-13_祖冲之公园站_祖冲之公园站B商铺(4号出口)_牙博士口腔.png
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const MAX_SHOP_PHOTO_BYTES = 2 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function detectPhotoMimeType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return '';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return '';
}

function getShortNoFromPhotoFileName(fileName) {
  return path.parse(fileName).name.split('_')[0].trim();
}

async function listPhotoFiles(photoDir) {
  const entries = await fs.readdir(photoDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

async function preparePhotoImport({ prisma, photoDir }) {
  const fileNames = await listPhotoFiles(photoDir);
  const seenShortNos = new Set();
  const records = [];
  const errors = [];

  for (const fileName of fileNames) {
    const shortNo = getShortNoFromPhotoFileName(fileName);
    const filePath = path.join(photoDir, fileName);
    const content = await fs.readFile(filePath);
    const mimeType = detectPhotoMimeType(content);

    if (!shortNo) {
      errors.push(`${fileName}: 文件名缺少 shortNo 前缀`);
      continue;
    }
    if (seenShortNos.has(shortNo)) {
      errors.push(`${fileName}: shortNo ${shortNo} 出现重复照片`);
      continue;
    }
    seenShortNos.add(shortNo);
    if (content.length > MAX_SHOP_PHOTO_BYTES) {
      errors.push(`${fileName}: 照片大小超过 2MB`);
      continue;
    }
    if (!mimeType) {
      errors.push(`${fileName}: 照片格式不受支持，仅支持 JPEG/PNG/WebP`);
      continue;
    }

    const shops = await prisma.shop.findMany({
      where: { shortNo },
      select: { shopUid: true, shortNo: true, name: true }
    });
    if (shops.length !== 1) {
      errors.push(`${fileName}: shortNo ${shortNo} 匹配到 ${shops.length} 个商铺`);
      continue;
    }

    records.push({
      fileName,
      shortNo,
      shopUid: shops[0].shopUid,
      shopName: shops[0].name,
      mimeType,
      byteSize: content.length,
      sha256: crypto.createHash('sha256').update(content).digest('hex'),
      content
    });
  }

  if (errors.length > 0) {
    const error = new Error(`照片文件未能唯一匹配商铺或通过校验:\n${errors.join('\n')}`);
    error.details = errors;
    throw error;
  }

  return records;
}

async function importShopPhotosFromDirectory(options = {}) {
  const prisma = options.prisma || new PrismaClient();
  const ownsPrisma = !options.prisma;
  const photoDir = options.photoDir || path.resolve(process.cwd(), '商铺照片');
  const dryRun = Boolean(options.dryRun);
  const logger = options.logger || console;

  try {
    const records = await preparePhotoImport({ prisma, photoDir });

    if (dryRun) {
      logger.log(`dry-run: 已匹配 ${records.length} 张照片，不写入数据库`);
      return {
        photoDir,
        matchedCount: records.length,
        importedCount: 0,
        skippedCount: 0,
        dryRun: true,
        photos: records.map(({ content, ...record }) => record)
      };
    }

    for (const record of records) {
      const data = {
        mimeType: record.mimeType,
        byteSize: record.byteSize,
        sha256: record.sha256,
        content: record.content
      };
      await prisma.shopPhoto.upsert({
        where: { shopUid: record.shopUid },
        update: data,
        create: { shopUid: record.shopUid, ...data }
      });
      logger.log(`已导入 ${record.shortNo} ${record.shopName}: ${record.fileName}`);
    }

    return {
      photoDir,
      matchedCount: records.length,
      importedCount: records.length,
      skippedCount: 0,
      dryRun: false,
      photos: records.map(({ content, ...record }) => record)
    };
  } finally {
    if (ownsPrisma) await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const dirArg = args.find(arg => arg.startsWith('--dir='));
  const photoDir = dirArg ? path.resolve(dirArg.slice('--dir='.length)) : path.resolve(process.cwd(), '商铺照片');
  const result = await importShopPhotosFromDirectory({ photoDir, dryRun });
  console.log(`${dryRun ? '已校验' : '已导入'}照片数量: ${dryRun ? result.matchedCount : result.importedCount}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('商铺照片导入失败:', err.message);
    process.exit(1);
  });
}

module.exports = {
  importShopPhotosFromDirectory,
  detectPhotoMimeType,
  getShortNoFromPhotoFileName
};
