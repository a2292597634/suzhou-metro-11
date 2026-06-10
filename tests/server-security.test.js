/**
 * 服务端安全改造测试 — 认证、CORS、静态路由、CSP
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// 设置测试环境变量
process.env.AUTH_TOKEN = 'test-secret-token';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:8081';
process.env.DATABASE_URL = 'postgresql://postgres:metro123@localhost:5432/suzhou_metro?schema=public';

// 动态导入 server.js（需要在设置 env 之后）
const { app, authenticateToken, corsMiddleware, setSecurityHeaders } = await import('../server.js');

describe('认证中间件', () => {
  it('无 Authorization header 时应返回 401', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ data: { stations: [] } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未授权，缺少认证信息');
  });

  it('Authorization 格式为 Basic 时应返回 401', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Basic dXNlcjpwYXNz')
      .send({ data: { stations: [] } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未授权，Token 格式不正确');
  });

  it('错误的 Bearer Token 时应返回 401', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer wrong-token')
      .send({ data: { stations: [] } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未授权，Token 无效');
  });

  it('正确的 Bearer Token 时应通过认证', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer test-secret-token')
      .send({ data: { stations: [] } });

    // 认证通过后，因为数据库可能不存在，可能返回 500
    // 但状态码不应该是 401
    expect(res.status).not.toBe(401);
  });

  it('GET /api/data 不应要求认证', async () => {
    const res = await request(app).get('/api/data');
    expect(res.status).not.toBe(401);
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

  it('未设置白名单时默认拒绝跨域', async () => {
    const originalOrigins = process.env.ALLOWED_ORIGINS;
    process.env.ALLOWED_ORIGINS = '';

    // 需要重新加载或测试中间件逻辑
    // 这里简化：验证当前环境的行为
    const res = await request(app)
      .get('/api/data')
      .set('Origin', 'http://localhost:3000');

    // ALLOWED_ORIGINS 为空时，任何来源都不在白名单中
    expect(res.headers['access-control-allow-origin']).toBeUndefined();

    process.env.ALLOWED_ORIGINS = originalOrigins;
  });
});

describe('CSP Header', () => {
  it('API 响应应携带 Content-Security-Policy', async () => {
    const res = await request(app).get('/api/data');
    expect(res.headers['content-security-policy']).toBe("default-src 'self'");
  });

  it('静态文件响应应携带 Content-Security-Policy', async () => {
    const res = await request(app).get('/');
    expect(res.headers['content-security-policy']).toBe("default-src 'self'");
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

  it('HTML 页面应注入 data-auth-token', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('data-auth-token="test-secret-token"');
  });
});
