/**
 * Vitest setupFile — 在每个测试文件前运行
 * 仅在测试数据库可用时清理数据
 */
const { PrismaClient } = require('@prisma/client');

const dbAvailable = process.env.TEST_DB_AVAILABLE === '1';

if (dbAvailable) {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    try {
      await prisma.shop.deleteMany();
      await prisma.station.deleteMany();
      await prisma.globalStats.deleteMany();
      await prisma.gradeInfo.deleteMany();
    } catch (e) {
      console.warn('⚠️  测试数据库清理失败:', e.message);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}
