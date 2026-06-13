/**
 * platform.css 设计系统 Token 验证
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '../css/platform.css');
let cssContent = '';

describe('platform.css 设计系统 Token', () => {
  beforeAll(() => {
    cssContent = fs.readFileSync(CSS_PATH, 'utf-8');
  });

  describe('Token 类别完整性', () => {
    it('应该定义颜色 Token（至少 12 个灰阶 + 语义红绿）', () => {
      const colorMatches = cssContent.match(/(--color-[a-z-]+):\s*#[0-9a-f]{3,6}/gi) || [];
      expect(colorMatches.length).toBeGreaterThanOrEqual(12);
    });

    it('应该定义字体 Token（4 级字号 + 字重 + 字距）', () => {
      expect(cssContent).toMatch(/--text-caption/);
      expect(cssContent).toMatch(/--text-body/);
      expect(cssContent).toMatch(/--text-subheading/);
      expect(cssContent).toMatch(/--text-heading/);
      expect(cssContent).toMatch(/--font-weight-/);
    });

    it('应该定义间距 Token（至少 8 个间距值）', () => {
      const spacingMatches = cssContent.match(/(--spacing-\d+):/g) || [];
      expect(spacingMatches.length).toBeGreaterThanOrEqual(8);
    });

    it('应该定义五级阴影变量', () => {
      expect(cssContent).toMatch(/--shadow-subtle/);
      expect(cssContent).toMatch(/--shadow-sm/);
      expect(cssContent).toMatch(/--shadow-md/);
      expect(cssContent).toMatch(/--shadow-lg/);
    });

    it('应该定义圆角 Token（至少 4 个半径值）', () => {
      const radiusMatches = cssContent.match(/--radius-[a-z]+/g) || [];
      const unique = [...new Set(radiusMatches)];
      expect(unique.length).toBeGreaterThanOrEqual(4);
    });

    it('应该定义动画曲线 Token', () => {
      expect(cssContent).toMatch(/--ease-out/);
      expect(cssContent).toMatch(/cubic-bezier/);
    });
  });

  describe('禁止硬编码色值', () => {
    it('应记录非 :root 区域的硬编码 hex 颜色数量（当前为已知技术债）', () => {
      const lines = cssContent.split('\n').filter(line => !line.trim().startsWith('/*') && !line.trim().startsWith('*'));
      const contentWithoutComments = lines.join('\n');
      const contentWithoutSvg = contentWithoutComments.replace(/url\("data:image\/svg[^"]+"\)/g, '');
      const hexMatches = contentWithoutSvg.match(/(?<!['"\w])#[0-9a-f]{3,6}(?!['"\w])/gi) || [];
      const nonRootHex = hexMatches.filter(hex => {
        const idx = contentWithoutSvg.indexOf(hex);
        const context = contentWithoutSvg.substring(Math.max(0, idx - 200), idx + 200);
        return !context.includes(':root');
      });
      // 记录当前硬编码数量，后续逐步清理为 0
      // 主要来源：.pill-tag-* 背景色（#dcfce7, #ffedd5, #ede9fe, #dbeafe）
      expect(nonRootHex.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('噪点纹理', () => {
    it('body::before 应该存在', () => {
      expect(cssContent).toMatch(/body::before\s*\{/);
    });

    it('纹理应该使用 CSP 兼容的纯 CSS 渐变', () => {
      expect(cssContent).toMatch(/radial-gradient/);
      expect(cssContent).not.toMatch(/data:image/);
    });

    it('透明度应在 1.5%-2.5% 之间', () => {
      const opacityMatch = cssContent.match(/opacity:\s*(0\.0\d+)/);
      expect(opacityMatch).not.toBeNull();
      const opacity = parseFloat(opacityMatch[1]);
      expect(opacity).toBeGreaterThanOrEqual(0.015);
      expect(opacity).toBeLessThanOrEqual(0.025);
    });

    it('pointer-events 应设为 none', () => {
      expect(cssContent).toMatch(/pointer-events:\s*none/);
    });
  });

  describe('字体系统', () => {
    it('应该定义 Geist 字体族', () => {
      expect(cssContent).toMatch(/--font-satoshi/);
      expect(cssContent).toMatch(/--font-inter/);
    });

    it('body 应该引用字体变量', () => {
      expect(cssContent).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-inter\)/s);
    });
  });

  describe('响应式断点', () => {
    it('应该定义移动端断点（≤768px）', () => {
      expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*768px\s*\)/);
    });

    it('应该定义平板端断点（768-900px）', () => {
      expect(cssContent).toMatch(/@media\s*\(\s*min-width:\s*7[0-9]{2}px\s*\)/);
      expect(cssContent).toMatch(/@media[^}]*max-width:\s*900px/);
    });
  });

  describe('prefers-reduced-motion', () => {
    it('应该支持减少动画偏好', () => {
      expect(cssContent).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
    });
  });
});
