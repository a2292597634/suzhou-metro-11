import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// 强制从 .env.test 加载 DATABASE_URL 等关键变量（覆盖已有环境变量）
const envTestPath = resolve(__dirname, '.env.test');
try {
  const content = readFileSync(envTestPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // 去掉首尾引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  console.log(`◇ 已从 .env.test 加载测试环境变量`);
} catch (_) {
  console.warn('⚠️  未找到 .env.test，使用当前环境变量');
}

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      url: 'http://localhost:8081/index.html'
    },
    globals: true,
    include: ['tests/**/*.test.js'],
    globalSetup: ['tests/globalSetup.js'],
    setupFiles: ['tests/setupFile.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
});
