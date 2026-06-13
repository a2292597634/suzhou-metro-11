import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = resolve(process.cwd(), '.github/workflows/test.yml');

describe('GitHub Actions 测试工作流', () => {
  it('应包含系统 Chrome 配置步骤', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('command -v google-chrome');
    expect(workflow).toContain('PUPPETEER_EXECUTABLE_PATH');
  });

  it('浏览器配置步骤应位于全量测试之前', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow.indexOf('PUPPETEER_EXECUTABLE_PATH'))
      .toBeLessThan(workflow.indexOf('npm run test:all'));
  });

  it('应验证系统 Chrome 路径可执行', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('test -n "$CHROME_PATH"');
    expect(workflow).toContain('test -x "$CHROME_PATH"');
    expect(workflow).toContain('"$CHROME_PATH" --version');
  });

  it('E2E 应把系统 Chrome 路径传给后续步骤', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain(
      'echo "PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> "$GITHUB_ENV"'
    );
  });

  it('使用系统 Chrome 时应跳过 Puppeteer 下载', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain("PUPPETEER_SKIP_DOWNLOAD: 'true'");
  });
});
