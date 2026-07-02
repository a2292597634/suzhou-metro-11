/**
 * 静态快照导出测试 — 验证 default-data、manifest 和照片资产
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import { spawnSync } from 'child_process';

const pngPhotoBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
let tempRoot;
const exportScriptPath = pathToFileURL(path.resolve('tools/export-static-snapshot.js')).href;
const publishScriptPath = path.resolve('tools/publish-static-snapshot.js');

function createSnapshotPrisma() {
  const photoHash = crypto.createHash('sha256').update(pngPhotoBuffer).digest('hex');
  const station = {
    id: 'station-static-snapshot',
    name: '静态快照站',
    grade: 'S',
    x: 100,
    y: 100,
    pos: 'top',
    transfer: false,
    transferLine: null,
    version: 1,
    shops: [
      {
        shopUid: 'shop_uid_static_photo',
        no: 1,
        shortNo: 'S-01',
        name: '有照片商铺',
        type: '商铺',
        area: 12,
        tenant: '',
        contact: '',
        openDate: '',
        status: '营业中',
        power: '',
        water: '/',
        remark: '',
        photo: {
          mimeType: 'image/png',
          byteSize: pngPhotoBuffer.length,
          sha256: photoHash,
          content: pngPhotoBuffer
        }
      },
      {
        shopUid: 'shop_uid_static_empty',
        no: 2,
        shortNo: 'S-02',
        name: '无照片商铺',
        type: '商铺',
        area: 15,
        tenant: '',
        contact: '',
        openDate: '',
        status: '未出租',
        power: '',
        water: '/',
        remark: '',
        photo: null
      }
    ]
  };

  return {
    photoHash,
    prisma: {
      station: { findMany: async () => [station] },
      globalStats: {
        findUnique: async () => ({
          id: 1,
          statsDate: '2026-07-01',
          totalShops: 2,
          rentedShops: 1,
          vacantShops: 1,
          rentRate: '50%'
        })
      },
      gradeInfo: {
        findMany: async () => ([
          { id: 'S', name: 'S级', desc: '核心站点', color: '#ff0000' }
        ])
      }
    }
  };
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

describe('静态快照导出', () => {
  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'suzhou-static-snapshot-'));
  });

  afterEach(async () => {
    if (tempRoot) {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('应该导出 data/default-data.json、data/static-manifest.json 和照片资产文件', async () => {
    const { photoHash, prisma } = createSnapshotPrisma();
    const { exportStaticSnapshot } = await import(exportScriptPath);

    const result = await exportStaticSnapshot({
      prisma,
      outputRoot: tempRoot,
      generatedAt: new Date('2026-07-01T03:30:00.000Z')
    });

    const defaultDataPath = path.join(tempRoot, 'data', 'default-data.json');
    const manifestPath = path.join(tempRoot, 'data', 'static-manifest.json');
    const expectedPhotoPath = path.join(tempRoot, 'assets', 'shop-photos', `shop_uid_static_photo-${photoHash.slice(0, 12)}.png`);

    await expect(fs.access(defaultDataPath)).resolves.toBeUndefined();
    await expect(fs.access(manifestPath)).resolves.toBeUndefined();
    await expect(fs.access(expectedPhotoPath)).resolves.toBeUndefined();
    expect(result.photoCount).toBe(1);
  });

  it('应该使用 <shopUid>-<sha256-12>.<ext> 命名静态照片文件', async () => {
    const { photoHash, prisma } = createSnapshotPrisma();
    const { exportStaticSnapshot } = await import(exportScriptPath);

    await exportStaticSnapshot({ prisma, outputRoot: tempRoot, generatedAt: new Date('2026-07-01T03:30:00.000Z') });

    const files = await fs.readdir(path.join(tempRoot, 'assets', 'shop-photos'));
    expect(files).toEqual([`shop_uid_static_photo-${photoHash.slice(0, 12)}.png`]);
  });

  it('default-data.json 中所有非空照片路径都应该对应已存在文件', async () => {
    const { photoHash, prisma } = createSnapshotPrisma();
    const { exportStaticSnapshot } = await import(exportScriptPath);

    await exportStaticSnapshot({ prisma, outputRoot: tempRoot, generatedAt: new Date('2026-07-01T03:30:00.000Z') });

    const defaultData = await readJson(path.join(tempRoot, 'data', 'default-data.json'));
    const shops = defaultData.stations[0].shops;
    const photoShop = shops.find(shop => shop.shopUid === 'shop_uid_static_photo');
    const emptyShop = shops.find(shop => shop.shopUid === 'shop_uid_static_empty');

    expect(defaultData.snapshotId).toEqual(expect.any(String));
    expect(photoShop.photo).toBe(`/assets/shop-photos/shop_uid_static_photo-${photoHash.slice(0, 12)}.png`);
    expect(photoShop.photoHash).toBe(photoHash);
    expect(emptyShop.photo).toBe('');
    expect(emptyShop.photoHash).toBe('');

    for (const shop of shops.filter(item => item.photo)) {
      const localPath = path.join(tempRoot, shop.photo.replace(/^\//, ''));
      await expect(fs.access(localPath)).resolves.toBeUndefined();
    }
  });

  it('static-manifest.json 应包含 snapshotId、generatedAt、dataHash、photoCount 和 photos 清单', async () => {
    const { photoHash, prisma } = createSnapshotPrisma();
    const { exportStaticSnapshot } = await import(exportScriptPath);

    await exportStaticSnapshot({ prisma, outputRoot: tempRoot, generatedAt: new Date('2026-07-01T03:30:00.000Z') });

    const manifest = await readJson(path.join(tempRoot, 'data', 'static-manifest.json'));
    expect(manifest.snapshotId).toEqual(expect.any(String));
    expect(manifest.generatedAt).toBe('2026-07-01T03:30:00.000Z');
    expect(manifest.dataHash).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.photoCount).toBe(1);
    expect(manifest.photos).toEqual([
      {
        shopUid: 'shop_uid_static_photo',
        sha256: photoHash,
        path: `/assets/shop-photos/shop_uid_static_photo-${photoHash.slice(0, 12)}.png`,
        mimeType: 'image/png',
        byteSize: pngPhotoBuffer.length
      }
    ]);
  });
});
describe('静态发布脚本', () => {
  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'suzhou-static-publish-'));
  });

  afterEach(async () => {
    if (tempRoot) {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  function runPublish(args = [], env = {}) {
    return spawnSync(process.execPath, [publishScriptPath, ...args], {
      cwd: path.resolve('.'),
      env: { ...process.env, ...env },
      encoding: 'utf8'
    });
  }

  it('publish-static-snapshot.js --dry-run 应验证文件但不 commit、不 push', () => {
    const result = runPublish(['--dry-run'], {
      STATIC_EXPORT_ROOT: tempRoot,
      STATIC_PUBLISH_BRANCH: 'gh-pages',
      STATIC_PUBLISH_REMOTE: 'origin',
      STATIC_PUBLISH_AUTHOR_NAME: 'Codex Test',
      STATIC_PUBLISH_AUTHOR_EMAIL: 'codex@example.com'
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('dry-run');
    expect(result.stdout).toContain('不会 commit 或 push');
  });

  it('缺少 STATIC_PUBLISH_BRANCH 等配置时应该拒绝发布', () => {
    const result = runPublish([], { STATIC_EXPORT_ROOT: tempRoot, STATIC_PUBLISH_BRANCH: '' });

    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toContain('缺少静态发布配置');
  });

  it('应该拒绝默认推送到 main 或 codex/* 分支', () => {
    for (const branch of ['main', 'codex/add-photo-database-static-publish-2026-07-01']) {
      const result = runPublish(['--dry-run'], {
        STATIC_EXPORT_ROOT: tempRoot,
        STATIC_PUBLISH_BRANCH: branch,
        STATIC_PUBLISH_REMOTE: 'origin',
        STATIC_PUBLISH_AUTHOR_NAME: 'Codex Test',
        STATIC_PUBLISH_AUTHOR_EMAIL: 'codex@example.com'
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr + result.stdout).toContain('禁止发布到');
    }
  });
});
