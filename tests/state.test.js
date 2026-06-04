/**
 * 共享状态测试 —— js/modules/state.js
 */
import { describe, it, expect } from 'vitest';
import { state } from '../js/modules/state.js';

describe('共享状态', () => {
  it('应该包含画布配置', () => {
    expect(state.config).toBeDefined();
    expect(state.config.width).toBe(2520);
    expect(state.config.height).toBe(1080);
    expect(state.config.mainLineY).toBe(480);
    expect(state.config.storageKey).toBe('suzhou_m11_battle_map_data_v4');
  });

  it('应该包含商业价值分级', () => {
    expect(state.gradeInfo).toBeDefined();
    expect(state.gradeInfo.S).toBeDefined();
    expect(state.gradeInfo.A).toBeDefined();
    expect(state.gradeInfo.B).toBeDefined();
    expect(state.gradeInfo.C).toBeDefined();
    expect(state.gradeInfo.S.name).toContain('S级');
    expect(state.gradeInfo.S.color).toMatch(/^#/);
  });

  it('站点数据初始应为空数组', () => {
    expect(Array.isArray(state.stations)).toBe(true);
  });

  it('全局统计初始应为空对象', () => {
    expect(typeof state.globalStats).toBe('object');
  });

  it('API 基础地址初始应为空字符串', () => {
    expect(state.apiBase).toBe('');
  });

  it('视口状态应该有正确的默认值', () => {
    expect(state.viewport).toBeDefined();
    expect(state.viewport.scale).toBe(1);
    expect(state.viewport.x).toBe(0);
    expect(state.viewport.y).toBe(0);
    expect(state.viewport.minScale).toBe(0.3);
    expect(state.viewport.maxScale).toBe(3);
  });

  it('拖动状态初始应为 false', () => {
    expect(state.isDragging).toBe(false);
    expect(state.dragStart).toEqual({ x: 0, y: 0 });
    expect(state.lastMouse).toEqual({ x: 0, y: 0 });
  });

  it('触控状态初始应为 false', () => {
    expect(state.isTouchDragging).toBe(false);
    expect(state.touchStart).toEqual({ x: 0, y: 0 });
  });

  it('当前编辑站点索引初始应为 null', () => {
    expect(state.editingStationIdx).toBeNull();
  });
});
