/**
 * Vitest globalSetup — 在所有测试文件之前运行
 * 确保使用测试数据库，并在可用时部署迁移
 */
const { execSync } = require('child_process');
const path = require('path');

module.exports = async function setup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('⚠️  DATABASE_URL 未设置，跳过数据库迁移');
    process.env.TEST_DB_AVAILABLE = '0';
    return;
  }

  // 硬错误：非测试数据库直接拒绝运行
  if (!dbUrl.includes('_test')) {
    console.error('❌ 错误: DATABASE_URL 不包含 _test！');
    console.error('   测试必须使用独立的测试数据库，不允许连接生产数据库。');
    console.error('   请在 vitest.config.js 中设置 DATABASE_URL 指向 suzhou_metro_test。');
    process.exit(1);
  }

  console.log(`🧪 测试数据库: ${dbUrl}`);

  try {
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'pipe'
    });
    console.log('✅ 测试数据库迁移完成');
    process.env.TEST_DB_AVAILABLE = '1';
  } catch (err) {
    console.warn('⚠️  测试数据库不可用，跳过迁移。需要 DB 的测试将被跳过。');
    process.env.TEST_DB_AVAILABLE = '0';
  }
};
