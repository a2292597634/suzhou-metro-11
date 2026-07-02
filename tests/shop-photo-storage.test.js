/**
 * 商铺照片存储测试 — 验证 shopUid、ShopPhoto 模型和照片元数据
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const dbAvailable = process.env.TEST_DB_AVAILABLE === '1';
const prisma = new PrismaClient();
const { validateShopPhotoUpload, getPhotoExtensionFromMimeType } = await import('../server.js');

async function cleanPhotoStorageData() {
  if (!dbAvailable) return;
  if (prisma.shopPhoto) {
    await prisma.shopPhoto.deleteMany();
  }
  await prisma.shop.deleteMany();
  await prisma.station.deleteMany();
}

async function createStation(id = 'station-photo-test') {
  return prisma.station.create({
    data: {
      id,
      name: '照片测试站',
      grade: 'A',
      x: 100,
      y: 100,
      pos: 'top',
      transfer: false,
      version: 1
    }
  });
}

function createShopData(overrides = {}) {
  return {
    no: 1,
    shortNo: 'P-01',
    name: '照片测试铺',
    type: '商铺',
    area: 18.5,
    tenant: '',
    contact: '',
    openDate: '',
    status: '未出租',
    power: '',
    water: '/',
    remark: '',
    stationId: 'station-photo-test',
    ...overrides
  };
}

describe('商铺稳定身份 shopUid', () => {
  beforeEach(async () => {
    await cleanPhotoStorageData();
  });

  it('应该允许创建商铺时生成非空 shopUid', async () => {
    if (!dbAvailable) return;
    await prisma.$transaction(async (tx) => {
      await tx.station.create({
        data: {
          id: 'station-photo-test',
          name: '照片测试站',
          grade: 'A',
          x: 100,
          y: 100,
          pos: 'top',
          transfer: false,
          version: 1
        }
      });

      const shop = await tx.shop.create({
        data: createShopData()
      });

      expect(shop.shopUid).toEqual(expect.any(String));
      expect(shop.shopUid.length).toBeGreaterThan(0);
    });
  });

  it('应该拒绝重复的 shopUid 以保证商铺身份唯一', async () => {
    if (!dbAvailable) return;
    await prisma.$transaction(async (tx) => {
      await tx.station.create({
        data: {
          id: 'station-photo-test',
          name: '照片测试站',
          grade: 'A',
          x: 100,
          y: 100,
          pos: 'top',
          transfer: false,
          version: 1
        }
      });

      await tx.shop.create({
        data: createShopData({ shopUid: 'shop_uid_unique_test', no: 1, shortNo: 'P-01' })
      });

      await expect(
        tx.shop.create({
          data: createShopData({ shopUid: 'shop_uid_unique_test', no: 2, shortNo: 'P-02' })
        })
      ).rejects.toThrow();
    });
  });
});

describe('ShopPhoto 一铺一图模型', () => {
  beforeEach(async () => {
    await cleanPhotoStorageData();
  });

  it('应该为一个 shopUid 至多保存一张现场主图并记录完整元数据', async () => {
    if (!dbAvailable) return;
    await prisma.$transaction(async (tx) => {
      await tx.station.create({
        data: {
          id: 'station-photo-test',
          name: '照片测试站',
          grade: 'A',
          x: 100,
          y: 100,
          pos: 'top',
          transfer: false,
          version: 1
        }
      });
      const shop = await tx.shop.create({
        data: createShopData({ shopUid: 'shop_uid_photo_model' })
      });

      const photo = await tx.shopPhoto.create({
        data: {
          shopUid: shop.shopUid,
          mimeType: 'image/png',
          byteSize: 8,
          sha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          content: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00]),
          publishedStaticPath: '/assets/shop-photos/shop_uid_photo_model-0123456789ab.png',
          publishedSha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          publishedAt: new Date('2026-07-01T00:00:00.000Z')
        }
      });

      expect(photo.shopUid).toBe(shop.shopUid);
      expect(photo.mimeType).toBe('image/png');
      expect(photo.byteSize).toBe(8);
      expect(photo.sha256).toHaveLength(64);
      expect(Buffer.from(photo.content)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00]));
      expect(photo.publishedStaticPath).toContain('/assets/shop-photos/');
      expect(photo.publishedSha256).toBe(photo.sha256);
      expect(photo.createdAt).toBeInstanceOf(Date);
      expect(photo.updatedAt).toBeInstanceOf(Date);

      await expect(
        tx.shopPhoto.create({
          data: {
            shopUid: shop.shopUid,
            mimeType: 'image/png',
            byteSize: 8,
            sha256: 'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            content: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0x01, 0x01, 0x01])
          }
        })
      ).rejects.toThrow();
    });
  });
});
describe('照片文件安全校验', () => {
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const webpBuffer = Buffer.from('RIFF\x10\x00\x00\x00WEBPVP8 ', 'binary');

  it('应该根据 MIME 和 magic bytes 接受 JPEG、PNG、WebP 并计算 sha256', () => {
    const cases = [
      { buffer: jpegBuffer, mimetype: 'image/jpeg', ext: 'jpg' },
      { buffer: pngBuffer, mimetype: 'image/png', ext: 'png' },
      { buffer: webpBuffer, mimetype: 'image/webp', ext: 'webp' }
    ];

    for (const file of cases) {
      const result = validateShopPhotoUpload({ buffer: file.buffer, mimetype: file.mimetype, size: file.buffer.length });
      expect(result.mimeType).toBe(file.mimetype);
      expect(result.byteSize).toBe(file.buffer.length);
      expect(result.sha256).toBe(crypto.createHash('sha256').update(file.buffer).digest('hex'));
      expect(result.ext).toBe(file.ext);
      expect(getPhotoExtensionFromMimeType(file.mimetype)).toBe(file.ext);
    }
  });

  it('应该拒绝声明 MIME 与 magic bytes 不一致的伪装图片', () => {
    expect(() => validateShopPhotoUpload({ buffer: jpegBuffer, mimetype: 'image/png', size: jpegBuffer.length }))
      .toThrow(/类型|校验/);
  });

  it('应该拒绝空文件、超过 2MB 文件和非 JPEG/PNG/WebP 格式', () => {
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1, 0xff);
    const gif = Buffer.from('GIF89a', 'ascii');
    const svg = Buffer.from('<svg></svg>', 'utf8');
    const html = Buffer.from('<!doctype html><html></html>', 'utf8');

    expect(() => validateShopPhotoUpload({ buffer: Buffer.alloc(0), mimetype: 'image/png', size: 0 }))
      .toThrow(/为空|大小/);
    expect(() => validateShopPhotoUpload({ buffer: oversized, mimetype: 'image/png', size: oversized.length }))
      .toThrow(/大小|2MB/);
    expect(() => validateShopPhotoUpload({ buffer: gif, mimetype: 'image/gif', size: gif.length }))
      .toThrow(/类型|格式/);
    expect(() => validateShopPhotoUpload({ buffer: svg, mimetype: 'image/svg+xml', size: svg.length }))
      .toThrow(/类型|格式/);
    expect(() => validateShopPhotoUpload({ buffer: html, mimetype: 'text/html', size: html.length }))
      .toThrow(/类型|格式/);
  });
});
