import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const importScriptUrl = pathToFileURL(path.resolve('tools/import-shop-photos.js')).href;
const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);

let tempRoot;

function createMockPrisma() {
  const shops = new Map([
    ['S11-13', [{ shopUid: 'shop_uid_s11_13', shortNo: 'S11-13', name: 'B商铺' }]],
    ['S11-18', [{ shopUid: 'shop_uid_s11_18', shortNo: 'S11-18', name: 'A商铺' }]]
  ]);
  const upsert = vi.fn(async args => args.create);

  return {
    shop: {
      findMany: vi.fn(async ({ where }) => shops.get(where.shortNo) || [])
    },
    shopPhoto: { upsert },
    $disconnect: vi.fn()
  };
}

async function writePhoto(name, content = pngBuffer) {
  await fs.writeFile(path.join(tempRoot, name), content);
}

describe('商铺照片目录导入', () => {
  beforeEach(async () => {
    vi.resetModules();
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'suzhou-import-shop-photos-'));
  });

  it('应该按文件名前缀 shortNo 匹配商铺并写入 ShopPhoto', async () => {
    await writePhoto('S11-13_祖冲之公园站_祖冲之公园站B商铺(4号出口)_牙博士口腔.png');
    const prisma = createMockPrisma();
    const { importShopPhotosFromDirectory } = await import(importScriptUrl);

    const result = await importShopPhotosFromDirectory({
      prisma,
      photoDir: tempRoot,
      logger: { log: vi.fn(), warn: vi.fn() }
    });

    const expectedHash = crypto.createHash('sha256').update(pngBuffer).digest('hex');
    expect(result).toMatchObject({ importedCount: 1, skippedCount: 0 });
    expect(prisma.shop.findMany).toHaveBeenCalledWith({ where: { shortNo: 'S11-13' }, select: { shopUid: true, shortNo: true, name: true } });
    expect(prisma.shopPhoto.upsert).toHaveBeenCalledWith({
      where: { shopUid: 'shop_uid_s11_13' },
      update: {
        mimeType: 'image/png',
        byteSize: pngBuffer.length,
        sha256: expectedHash,
        content: pngBuffer
      },
      create: {
        shopUid: 'shop_uid_s11_13',
        mimeType: 'image/png',
        byteSize: pngBuffer.length,
        sha256: expectedHash,
        content: pngBuffer
      }
    });
  });

  it('dry-run 应该只校验匹配关系而不写入数据库', async () => {
    await writePhoto('S11-18_江浦站_江浦站A商铺(4号出口)_牙博士口腔.png');
    const prisma = createMockPrisma();
    const { importShopPhotosFromDirectory } = await import(importScriptUrl);

    const result = await importShopPhotosFromDirectory({
      prisma,
      photoDir: tempRoot,
      dryRun: true,
      logger: { log: vi.fn(), warn: vi.fn() }
    });

    expect(result).toMatchObject({ importedCount: 0, matchedCount: 1 });
    expect(prisma.shopPhoto.upsert).not.toHaveBeenCalled();
  });

  it('文件名前缀找不到唯一商铺时应该拒绝导入', async () => {
    await writePhoto('S11-99_不存在站_不存在商铺.png');
    const prisma = createMockPrisma();
    const { importShopPhotosFromDirectory } = await import(importScriptUrl);

    await expect(importShopPhotosFromDirectory({
      prisma,
      photoDir: tempRoot,
      logger: { log: vi.fn(), warn: vi.fn() }
    })).rejects.toThrow('照片文件未能唯一匹配商铺');

    expect(prisma.shopPhoto.upsert).not.toHaveBeenCalled();
  });

  it('内容不是 JPEG/PNG/WebP 时应该拒绝导入', async () => {
    await writePhoto('S11-13_祖冲之公园站_祖冲之公园站B商铺(4号出口)_牙博士口腔.png', Buffer.from('<svg></svg>'));
    const prisma = createMockPrisma();
    const { importShopPhotosFromDirectory } = await import(importScriptUrl);

    await expect(importShopPhotosFromDirectory({
      prisma,
      photoDir: tempRoot,
      logger: { log: vi.fn(), warn: vi.fn() }
    })).rejects.toThrow('照片格式不受支持');

    expect(prisma.shopPhoto.upsert).not.toHaveBeenCalled();
  });
});
