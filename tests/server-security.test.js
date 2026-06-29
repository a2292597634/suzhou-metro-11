/**
 * 服务端安全改造测试 — 认证、登录、CORS、静态路由、CSP
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';

// 环境变量由 vitest.config.js 从 .env.test 加载，无需在此硬编码

const { app } = await import('../server.js');

const dbAvailable = process.env.TEST_DB_AVAILABLE === '1';

describe('认证中间件', () => {
  it('无 Authorization header 或 Cookie 时应返回 401', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ data: { stations: [] } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未授权，请先登录');
  });

  it('错误的 Bearer Token 时应返回 401', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer wrong-token')
      .send({ data: { stations: [] } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未授权，请先登录');
  });

  it('正确的 Bearer Token 时应通过认证', async () => {
    if (!dbAvailable) return;

    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer test-secret-token')
      .send({ data: { stations: [], globalStats: null } });

    // 认证通过，DB 可用时应返回 200
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/data 不应要求认证', async () => {
    const res = await request(app).get('/api/data');
    expect(res.status).not.toBe(401);
  });
});

describe('Cookie 认证与登录', () => {
  it('POST /api/login 错误密码应返回 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('密码错误');
  });

  it('POST /api/login 正确密码应返回 200 并设置 Cookie', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ password: 'test-secret-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // 应设置 HttpOnly Cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const authCookie = (Array.isArray(cookies) ? cookies : [cookies])
      .find(c => c.startsWith('auth_token='));
    expect(authCookie).toBeDefined();
    expect(authCookie).toContain('HttpOnly');
  });

  it('携带有效 Cookie 的写请求应通过认证', async () => {
    if (!dbAvailable) return;

    const loginRes = await request(app)
      .post('/api/login')
      .send({ password: 'test-secret-token' });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/data')
      .set('Cookie', Array.isArray(cookies) ? cookies : [cookies])
      .send({ data: { stations: [], globalStats: null } });

    // 认证通过，DB 可用时应返回 200
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/logout 应清除 Cookie', async () => {
    const res = await request(app).post('/api/logout');
    expect(res.status).toBe(200);
  });

  it('GET /api/auth-status 应返回认证状态', async () => {
    const res = await request(app).get('/api/auth-status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('authenticated');
  });
});

describe('CORS 白名单', () => {
  it('白名单内的来源应返回 Access-Control-Allow-Origin', async () => {
    const res = await request(app)
      .get('/api/data')
      .set('Origin', 'http://localhost:3000');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('白名单外的来源不应返回 Access-Control-Allow-Origin', async () => {
    const res = await request(app)
      .get('/api/data')
      .set('Origin', 'https://evil.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('CSP Header', () => {
  it('API 响应应携带 Content-Security-Policy', async () => {
    const res = await request(app).get('/api/data');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('静态文件响应应携带 Content-Security-Policy', async () => {
    const res = await request(app).get('/');
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});

describe('静态路由白名单', () => {
  it('前端资源 /css/style.css 应可访问', async () => {
    const res = await request(app).get('/css/style.css');
    expect(res.status).toBe(200);
  });

  it('前端资源 /js/modules/data.js 应可访问', async () => {
    const res = await request(app).get('/js/modules/data.js');
    expect(res.status).toBe(200);
  });

  it('后端代码 /server.js 应返回 404', async () => {
    const res = await request(app).get('/server.js');
    expect(res.status).toBe(404);
  });

  it('.env 文件应返回 404', async () => {
    const res = await request(app).get('/.env');
    expect(res.status).toBe(404);
  });

  it('数据库文件应返回 404', async () => {
    const res = await request(app).get('/data/battle-map.db');
    expect(res.status).toBe(404);
  });

  it('prisma schema 应返回 404', async () => {
    const res = await request(app).get('/prisma/schema.prisma');
    expect(res.status).toBe(404);
  });

  it('HTML 页面不应包含明文 Token', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('test-secret-token');
    expect(res.text).not.toContain('data-auth-token');
  });
});

describe('Zod 数据校验', () => {
  const authHeader = 'Bearer test-secret-token';

  it('缺少 name 字段应返回 400', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', authHeader)
      .send({ data: { stations: [{ id: 's1', grade: 'A', x: 100, y: 100, pos: 'top' }] } });

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  it('坐标超出范围应返回 400', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', authHeader)
      .send({ data: { stations: [{ id: 's1', name: '测试', grade: 'A', x: 9999, y: 100, pos: 'top' }] } });

    expect(res.status).toBe(400);
  });

  it('非法等级值应返回 400', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', authHeader)
      .send({ data: { stations: [{ id: 's1', name: '测试', grade: 'X', x: 100, y: 100, pos: 'top' }] } });

    expect(res.status).toBe(400);
  });

  it('非法照片字段（非 Data URL 字符串）应返回 400', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', authHeader)
      .send({
        data: {
          stations: [{
            id: 's1',
            name: '测试',
            grade: 'A',
            x: 100,
            y: 100,
            pos: 'top',
            shops: [{
              no: 1,
              shortNo: 'S11-1',
              name: '测试商铺',
              type: '商铺',
              area: 10,
              status: '营业中',
              photo: '<script>alert(1)</script>'
            }]
          }]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  it('超长照片字段应返回 400', async () => {
    // 构造超过 3,000,000 字符的字符串
    const longBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(3_000_001);
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', authHeader)
      .send({
        data: {
          stations: [{
            id: 's1',
            name: '测试',
            grade: 'A',
            x: 100,
            y: 100,
            pos: 'top',
            shops: [{
              no: 1,
              shortNo: 'S11-1',
              name: '测试商铺',
              type: '商铺',
              area: 10,
              status: '营业中',
              photo: longBase64
            }]
          }]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });
});
