/**
 * 认证数据流集成测试 — 端到端验证登录 → Cookie → 保存流程
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';

// 环境变量由 vitest.config.js 从 .env.test 加载，无需在此硬编码

const { app } = await import('../../server.js');

const dbAvailable = process.env.TEST_DB_AVAILABLE === '1';

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

  it('POST /api/data 保存商铺照片后 GET 应返回同一照片', async () => {
    if (!dbAvailable) return;

    const photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer test-secret-token')
      .send({
        data: {
          stations: [{
            id: 'photo-test-station',
            name: '照片测试站',
            grade: 'A',
            x: 100,
            y: 100,
            pos: 'top',
            shops: [{
              no: 1,
              shortNo: 'S11-T1',
              name: '测试商铺',
              type: '商铺',
              area: 10,
              status: '营业中',
              photo
            }]
          }]
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // 然后通过 GET 验证
    const getRes = await request(app).get('/api/data');
    expect(getRes.status).toBe(200);
    const station = getRes.body.data.stations.find(s => s.id === 'photo-test-station');
    expect(station).toBeDefined();
    expect(station.shops[0].photo).toBe(photo);
  });

  it('POST /api/data 不传 photo 字段时应默认为空字符串', async () => {
    if (!dbAvailable) return;

    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer test-secret-token')
      .send({
        data: {
          stations: [{
            id: 'no-photo-station',
            name: '无照片站',
            grade: 'B',
            x: 200,
            y: 200,
            pos: 'bottom',
            shops: [{
              no: 1,
              shortNo: 'S11-NP',
              name: '无照片商铺',
              type: '商铺',
              area: 10,
              status: '未出租'
            }]
          }]
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get('/api/data');
    const station = getRes.body.data.stations.find(s => s.id === 'no-photo-station');
    expect(station).toBeDefined();
    expect(station.shops[0].photo).toBe('');
  });
});
