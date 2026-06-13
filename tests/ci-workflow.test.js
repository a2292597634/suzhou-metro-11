import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = resolve(process.cwd(), '.github/workflows/test.yml');

describe('GitHub Actions 测试工作流', () => {
  it('应包含 Puppeteer 浏览器安装步骤', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('node tools/install-e2e-browser.mjs');
  });

  it('浏览器安装步骤应位于全量测试之前', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow.indexOf('node tools/install-e2e-browser.mjs'))
      .toBeLessThan(workflow.indexOf('npm run test:all'));
  });

  it('安装 Chrome 前应清理可能损坏的 Puppeteer 缓存', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow.indexOf('rm -rf "$PUPPETEER_CACHE_DIR"'))
      .toBeLessThan(workflow.indexOf('node tools/install-e2e-browser.mjs'));
  });

  it('E2E 应安装 Puppeteer 所需的 Chrome', () => {
    const workflow = readFileSync(workflowPath, 'utf8');
    const installer = readFileSync(
      resolve(process.cwd(), 'tools/install-e2e-browser.mjs'),
      'utf8'
    );

    expect(workflow).toContain('node tools/install-e2e-browser.mjs');
    expect(installer).toContain('PUPPETEER_REVISIONS.chrome');
    expect(installer).toContain('const installedBrowser = await install({');
    expect(installer).toContain('cacheDir');
  });

  it('应显式启用浏览器下载并固定缓存目录', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain("PUPPETEER_SKIP_DOWNLOAD: 'false'");
    expect(workflow).toContain('PUPPETEER_CACHE_DIR: ${{ github.workspace }}/.cache/puppeteer');
  });

  it('浏览器安装后应验证可执行文件存在', () => {
    const installer = readFileSync(
      resolve(process.cwd(), 'tools/install-e2e-browser.mjs'),
      'utf8'
    );

    expect(installer).toContain('fs.existsSync(installedBrowser.executablePath)');
  });
});
