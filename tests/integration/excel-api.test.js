/**
 * Excel API 集成测试 — 验证 3 个 Excel 端点的 HTTP 行为
 * 需要测试数据库可用，否则 DB 相关测试跳过
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

let app;
let dbAvailable = false;

beforeAll(async () => {
  try {
    const mod = await import('../../server.js');
    app = mod.app;
    const { PrismaClient } = await import('@prisma/client');
    const testPrisma = new PrismaClient();
    await testPrisma.$queryRaw`SELECT 1`;
    await testPrisma.$disconnect();
    dbAvailable = true;
  } catch (e) {
    dbAvailable = false;
  }
});

describe('Excel API 端点', () => {
  describe('GET /api/template-excel', () => {
    it('应该返回 xlsx Content-Type（无需 DB）', async () => {
      const res = await request(app).get('/api/template-excel');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/openxmlformats/);
    });
  });

  describe('GET /api/export-excel', () => {
    it('应该返回含数据的 xlsx', async () => {
      if (!dbAvailable) return; // 无 DB 时跳过
      const res = await request(app).get('/api/export-excel');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/openxmlformats/);
    });
  });

  describe('POST /api/import-excel', () => {
    it('无认证上传应该返回 401', async () => {
      const res = await request(app)
        .post('/api/import-excel')
        .attach('file', Buffer.from('dummy'), 'test.xlsx');
      expect(res.status).toBe(401);
    });

    it('未上传文件无认证应该返回 401', async () => {
      const res = await request(app).post('/api/import-excel');
      expect(res.status).toBe(401);
    });
  });
});
