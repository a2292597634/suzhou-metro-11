/**
 * 测试环境验证 —— 确保 Vitest + jsdom 正常工作
 */
import { describe, it, expect } from 'vitest';

describe('测试环境', () => {
  it('1 + 1 应该等于 2', () => {
    expect(1 + 1).toBe(2);
  });

  it('jsdom 应该提供 window 对象', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('jsdom 应该支持 DOM 操作', () => {
    const div = document.createElement('div');
    div.textContent = 'hello';
    document.body.appendChild(div);
    expect(document.body.querySelector('div').textContent).toBe('hello');
    div.remove();
  });

  it('jsdom 应该支持 localStorage', () => {
    localStorage.setItem('test-key', 'test-value');
    expect(localStorage.getItem('test-key')).toBe('test-value');
    localStorage.removeItem('test-key');
  });
});
