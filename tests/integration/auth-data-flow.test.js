/**
 * 认证数据流集成测试 — 端到端验证登录 → Cookie → 保存流程
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// 环境变量由 vitest.config.js 从 .env.test 加载，无需在此硬编码

const { app } = await import('../../server.js');
const prisma = new PrismaClient();

const dbAvailable = process.env.TEST_DB_AVAILABLE === '1';
const authHeader = 'Bearer test-secret-token';
const pngPhotoBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

async function resetPhotoApiData() {
  if (prisma.shopPhoto) {
    await prisma.shopPhoto.deleteMany();
  }
  await prisma.shop.deleteMany();
  await prisma.station.deleteMany();
}

async function createPhotoApiShop(shopUid = 'shop_uid_photo_api') {
  await resetPhotoApiData();
  await prisma.station.create({
    data: {
      id: 'station-photo-api',
      name: '照片 API 站',
      grade: 'A',
      x: 120,
      y: 120,
      pos: 'top',
      transfer: false,
      version: 1
    }
  });

  await prisma.shop.create({
    data: {
      shopUid,
      no: 1,
      shortNo: 'API-01',
      name: '照片 API 铺',
      type: '商铺',
      area: 10,
      tenant: '',
      contact: '',
      openDate: '',
      status: '未出租',
      power: '',
      water: '/',
      remark: '',
      stationId: 'station-photo-api'
    }
  });
}

describe('认证数据流集成', () => {
  it('携带正确 Bearer Token 的 POST /api/data 应通过认证', async () => {
    if (!dbAvailable) return;

    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer test-secret-token')
      .send({ data: { stations: [], globalStats: null } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('携带错误 Token 的 POST /api/data 应返回 401', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer wrong-token')
      .send({ data: { stations: [] } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未授权，请先登录');
  });

  it('无 Token 的 POST /api/data 应返回 401', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ data: { stations: [] } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未授权，请先登录');
  });

  it('GET /api/data 不应要求认证', async () => {
    const res = await request(app).get('/api/data');
    expect(res.status).not.toBe(401);
  });

  it('登录成功后可获取认证 Cookie 并使用它写数据', async () => {
    if (!dbAvailable) return;

    const loginRes = await request(app)
      .post('/api/login')
      .send({ password: 'test-secret-token' });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'];

    const dataRes = await request(app)
      .post('/api/data')
      .set('Cookie', Array.isArray(cookies) ? cookies : [cookies])
      .send({ data: { stations: [], globalStats: null } });

    expect(dataRes.status).toBe(200);
    expect(dataRes.body.success).toBe(true);
  });

  it('HTML 页面不应包含明文 Token', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('test-secret-token');
    expect(res.text).not.toContain('data-auth-token');
  });

  it('CORS 白名单内的请求应允许跨域', async () => {
    const res = await request(app)
      .get('/api/data')
      .set('Origin', 'http://localhost:3000');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('CORS 白名单外的请求不应允许跨域', async () => {
    const res = await request(app)
      .get('/api/data')
      .set('Origin', 'https://evil.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('所有响应应携带 CSP header', async () => {
    const res = await request(app).get('/api/data');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('敏感文件应返回 404', async () => {
    const res1 = await request(app).get('/server.js');
    expect(res1.status).toBe(404);

    const res2 = await request(app).get('/.env');
    expect(res2.status).toBe(404);

    const res3 = await request(app).get('/package.json');
    expect(res3.status).toBe(404);
  });

  it('普通 POST /api/data 保存已有商铺资料时应该保留同一 shopUid 的 ShopPhoto', async () => {
    if (!dbAvailable) return;

    if (prisma.shopPhoto) {
      await prisma.shopPhoto.deleteMany();
    }
    await prisma.shop.deleteMany();
    await prisma.station.deleteMany();

    await prisma.station.create({
      data: {
        id: 'station-photo-keep',
        name: '照片保留站',
        grade: 'A',
        x: 100,
        y: 100,
        pos: 'top',
        transfer: false,
        version: 1
      }
    });

    await prisma.shop.create({
      data: {
        shopUid: 'shop_uid_keep_photo',
        no: 1,
        shortNo: 'K-01',
        name: '原商铺名',
        type: '商铺',
        area: 12,
        tenant: '',
        contact: '',
        openDate: '',
        status: '未出租',
        power: '',
        water: '/',
        remark: '',
        stationId: 'station-photo-keep'
      }
    });

    await prisma.shopPhoto.create({
      data: {
        shopUid: 'shop_uid_keep_photo',
        mimeType: 'image/png',
        byteSize: 8,
        sha256: '1111111111111111111111111111111111111111111111111111111111111111',
        content: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00])
      }
    });

    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer test-secret-token')
      .send({
        data: {
          stations: [
            {
              id: 'station-photo-keep',
              name: '照片保留站',
              grade: 'A',
              x: 100,
              y: 100,
              pos: 'top',
              transfer: false,
              version: 1,
              shops: [
                {
                  shopUid: 'shop_uid_keep_photo',
                  no: 1,
                  shortNo: 'K-01',
                  name: '更新后的商铺名',
                  type: '商铺',
                  area: 15,
                  tenant: '',
                  contact: '',
                  openDate: '',
                  status: '营业中',
                  power: '',
                  water: '/',
                  remark: ''
                }
              ]
            }
          ],
          globalStats: null,
          gradeInfo: {}
        }
      });

    expect(res.status).toBe(200);
    const keptPhoto = await prisma.shopPhoto.findUnique({ where: { shopUid: 'shop_uid_keep_photo' } });
    expect(keptPhoto).not.toBeNull();
    expect(keptPhoto.sha256).toBe('1111111111111111111111111111111111111111111111111111111111111111');
  });

  it('PUT /api/shops/:shopUid/photo 应保存合法照片并返回轻量 URL 和元数据', async () => {
    if (!dbAvailable) return;
    await createPhotoApiShop('shop_uid_upload_success');

    const res = await request(app)
      .put('/api/shops/shop_uid_upload_success/photo')
      .set('Authorization', authHeader)
      .attach('photo', pngPhotoBuffer, { filename: 'shop.png', contentType: 'image/png' });

    const expectedHash = crypto.createHash('sha256').update(pngPhotoBuffer).digest('hex');
    expect(res.status).toBe(200);
    expect(res.body.shopUid).toBe('shop_uid_upload_success');
    expect(res.body.photoUrl).toBe(`/api/shop-photos/shop_uid_upload_success?v=${expectedHash.slice(0, 12)}`);
    expect(res.body.sha256).toBe(expectedHash);
    expect(res.body.mimeType).toBe('image/png');
    expect(res.body.byteSize).toBe(pngPhotoBuffer.length);

    const saved = await prisma.shopPhoto.findUnique({ where: { shopUid: 'shop_uid_upload_success' } });
    expect(saved).not.toBeNull();
    expect(saved.sha256).toBe(expectedHash);
  });

  it('照片上传应拒绝未认证、伪装 MIME、超大文件和危险格式', async () => {
    if (!dbAvailable) return;
    await createPhotoApiShop('shop_uid_upload_reject');

    const unauthRes = await request(app)
      .put('/api/shops/shop_uid_upload_reject/photo')
      .attach('photo', pngPhotoBuffer, { filename: 'shop.png', contentType: 'image/png' });
    expect(unauthRes.status).toBe(401);

    const spoofRes = await request(app)
      .put('/api/shops/shop_uid_upload_reject/photo')
      .set('Authorization', authHeader)
      .attach('photo', Buffer.from([0xff, 0xd8, 0xff, 0xe0]), { filename: 'fake.png', contentType: 'image/png' });
    expect(spoofRes.status).toBe(400);

    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1, 0xff);
    const oversizedRes = await request(app)
      .put('/api/shops/shop_uid_upload_reject/photo')
      .set('Authorization', authHeader)
      .attach('photo', oversized, { filename: 'big.png', contentType: 'image/png' });
    expect([400, 413]).toContain(oversizedRes.status);

    for (const [filename, contentType, buffer] of [
      ['bad.gif', 'image/gif', Buffer.from('GIF89a', 'ascii')],
      ['bad.svg', 'image/svg+xml', Buffer.from('<svg></svg>', 'utf8')],
      ['bad.html', 'text/html', Buffer.from('<!doctype html><html></html>', 'utf8')]
    ]) {
      const res = await request(app)
        .put('/api/shops/shop_uid_upload_reject/photo')
        .set('Authorization', authHeader)
        .attach('photo', buffer, { filename, contentType });
      expect(res.status).toBe(400);
    }
  });

  it('GET /api/shop-photos/:shopUid 应返回二进制内容、Content-Type、ETag 和 404', async () => {
    if (!dbAvailable) return;
    await createPhotoApiShop('shop_uid_photo_read');
    const hash = crypto.createHash('sha256').update(pngPhotoBuffer).digest('hex');
    await prisma.shopPhoto.create({
      data: {
        shopUid: 'shop_uid_photo_read',
        mimeType: 'image/png',
        byteSize: pngPhotoBuffer.length,
        sha256: hash,
        content: pngPhotoBuffer
      }
    });

    const res = await request(app).get(`/api/shop-photos/shop_uid_photo_read?v=${hash.slice(0, 12)}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(res.headers.etag).toBe(`"${hash}"`);
    expect(Buffer.from(res.body)).toEqual(pngPhotoBuffer);

    const missingRes = await request(app).get('/api/shop-photos/shop_uid_missing');
    expect(missingRes.status).toBe(404);
  });

  it('DELETE /api/shops/:shopUid/photo 应删除已有照片并拒绝未认证请求', async () => {
    if (!dbAvailable) return;
    await createPhotoApiShop('shop_uid_photo_delete');
    const hash = crypto.createHash('sha256').update(pngPhotoBuffer).digest('hex');
    await prisma.shopPhoto.create({
      data: {
        shopUid: 'shop_uid_photo_delete',
        mimeType: 'image/png',
        byteSize: pngPhotoBuffer.length,
        sha256: hash,
        content: pngPhotoBuffer
      }
    });

    const unauthRes = await request(app).delete('/api/shops/shop_uid_photo_delete/photo');
    expect(unauthRes.status).toBe(401);

    const res = await request(app)
      .delete('/api/shops/shop_uid_photo_delete/photo')
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    await expect(prisma.shopPhoto.findUnique({ where: { shopUid: 'shop_uid_photo_delete' } }))
      .resolves.toBeNull();
  });

  it('/api/data 应拒绝通过 shops[].photo 写入 Data URL 图片内容', async () => {
    if (!dbAvailable) return;

    const res = await request(app)
      .post('/api/data')
      .set('Authorization', authHeader)
      .send({
        data: {
          stations: [
            {
              id: 'station-data-url-reject',
              name: 'Data URL 拒绝站',
              grade: 'A',
              x: 100,
              y: 100,
              pos: 'top',
              transfer: false,
              version: 0,
              shops: [
                {
                  shopUid: 'shop_uid_data_url_reject',
                  no: 1,
                  shortNo: 'D-01',
                  name: 'Data URL 铺',
                  type: '商铺',
                  area: 10,
                  tenant: '',
                  contact: '',
                  openDate: '',
                  status: '未出租',
                  power: '',
                  water: '/',
                  remark: '',
                  photo: 'data:image/png;base64,AAAA'
                }
              ]
            }
          ],
          globalStats: null,
          gradeInfo: {}
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.details.join('\n')).toContain('照片内容必须通过照片 API 上传');
  });

  it('静态发布失败不应回滚数据库照片，状态接口应返回 failed 和错误信息', async () => {
    if (!dbAvailable) return;
    await createPhotoApiShop('shop_uid_publish_failed_keep');
    const hash = crypto.createHash('sha256').update(pngPhotoBuffer).digest('hex');
    await prisma.shopPhoto.create({
      data: {
        shopUid: 'shop_uid_publish_failed_keep',
        mimeType: 'image/png',
        byteSize: pngPhotoBuffer.length,
        sha256: hash,
        content: pngPhotoBuffer
      }
    });
    await prisma.staticPublishStatus.upsert({
      where: { id: 1 },
      update: { status: 'failed', error: 'push failed', finishedAt: new Date('2026-07-01T04:00:00.000Z') },
      create: { id: 1, status: 'failed', error: 'push failed', finishedAt: new Date('2026-07-01T04:00:00.000Z') }
    });

    const dataRes = await request(app).get('/api/data');
    expect(dataRes.status).toBe(200);
    const shop = dataRes.body.data.stations[0].shops.find(item => item.shopUid === 'shop_uid_publish_failed_keep');
    expect(shop.photo).toBe(`/api/shop-photos/shop_uid_publish_failed_keep?v=${hash.slice(0, 12)}`);

    const statusRes = await request(app).get('/api/static-publish/status');
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('failed');
    expect(statusRes.body.error).toBe('push failed');
  });

  it('POST /api/static-publish/request 应创建 pending 发布状态并要求认证', async () => {
    if (!dbAvailable) return;
    if (prisma.staticPublishStatus) {
      await prisma.staticPublishStatus.deleteMany();
    }

    const unauthRes = await request(app).post('/api/static-publish/request');
    expect(unauthRes.status).toBe(401);

    const res = await request(app)
      .post('/api/static-publish/request')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');

    const stored = await prisma.staticPublishStatus.findUnique({ where: { id: 1 } });
    expect(stored.status).toBe('pending');
    expect(stored.requestedAt).toBeInstanceOf(Date);
  });});
