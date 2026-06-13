import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = resolve(process.cwd(), '.github/workflows/test.yml');

describe('GitHub Actions 测试工作流', () => {
  it('应包含 Puppeteer 浏览器安装步骤', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('puppeteer browsers install');
  });

  it('浏览器安装步骤应位于全量测试之前', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow.indexOf('puppeteer browsers install'))
      .toBeLessThan(workflow.indexOf('npm run test:all'));
  });

  it('E2E 应安装 Puppeteer 所需的 Chrome', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('npx puppeteer browsers install chrome');
  });
});
