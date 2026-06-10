/**
 * 认证数据流集成测试 — 端到端验证 Token 读取 → 请求携带 → 服务端校验
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';

process.env.AUTH_TOKEN = 'integration-test-token';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://postgres:metro123@localhost:5432/suzhou_metro?schema=public';

const { app } = await import('../../server.js');

describe('认证数据流集成', () => {
  it('携带正确 Token 的 POST /api/data 应通过认证', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer integration-test-token')
      .send({ data: { stations: [], globalStats: null } });

    // 认证通过后，数据库可能不存在导致 500，但不应该是 401
    expect(res.status).not.toBe(401);
  });

  it('携带错误 Token 的 POST /api/data 应返回 401', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Authorization', 'Bearer wrong-token')
      .send({ data: { stations: [] } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未授权，Token 无效');
  });

  it('无 Token 的 POST /api/data 应返回 401', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ data: { stations: [] } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('未授权，缺少认证信息');
  });

  it('GET /api/data 不应要求认证', async () => {
    const res = await request(app).get('/api/data');
    expect(res.status).not.toBe(401);
  });

  it('HTML 页面应包含注入的 data-auth-token', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('data-auth-token="integration-test-token"');
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
    expect(res.headers['content-security-policy']).toBe("default-src 'self'");
  });

  it('敏感文件应返回 404', async () => {
    const res1 = await request(app).get('/server.js');
    expect(res1.status).toBe(404);

    const res2 = await request(app).get('/.env');
    expect(res2.status).toBe(404);

    const res3 = await request(app).get('/package.json');
    expect(res3.status).toBe(404);
  });
});
