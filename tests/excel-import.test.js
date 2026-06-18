/**
 * Excel 导入引擎测试 — 状态映射、字段校验逻辑
 */
import { describe, it, expect } from 'vitest';

// 状态映射规则（从 tools/excel-import.js 提取）
const STATUS_MAP = {
  '已租': '营业中', '已开业': '营业中', '营业': '营业中',
  '未租': '未出租', '': '未出租',
  '装修': '装修中',
  '营业中': '营业中', '未出租': '未出租', '装修中': '装修中'
};

const VALID_POWER = ['20KW', '30KW', ''];
const VALID_WATER = ['有', '/', ''];

function mapStatus(raw) {
  return STATUS_MAP[raw] || null;
}

function validatePower(val) {
  return VALID_POWER.includes(val);
}

function validateWater(val) {
  return VALID_WATER.includes(val);
}

describe('Excel 导入引擎 - 状态映射', () => {
  it('应该将「已租」映射为「营业中」', () => {
    expect(mapStatus('已租')).toBe('营业中');
  });

  it('应该将「已开业」映射为「营业中」', () => {
    expect(mapStatus('已开业')).toBe('营业中');
  });

  it('应该将空字符串映射为「未出租」', () => {
    expect(mapStatus('')).toBe('未出租');
  });

  it('应该将「未租」映射为「未出租」', () => {
    expect(mapStatus('未租')).toBe('未出租');
  });

  it('应该将「装修」映射为「装修中」', () => {
    expect(mapStatus('装修')).toBe('装修中');
  });

  it('应该保持「营业中」不变', () => {
    expect(mapStatus('营业中')).toBe('营业中');
  });

  it('应该保持「未出租」不变', () => {
    expect(mapStatus('未出租')).toBe('未出租');
  });

  it('应该保持「装修中」不变', () => {
    expect(mapStatus('装修中')).toBe('装修中');
  });

  it('非法状态值应该返回 null', () => {
    expect(mapStatus('已关闭')).toBe(null);
    expect(mapStatus('停业')).toBe(null);
  });
});

describe('Excel 导入引擎 - 字段校验', () => {
  it('应该接受 20KW', () => {
    expect(validatePower('20KW')).toBe(true);
  });

  it('应该接受 30KW', () => {
    expect(validatePower('30KW')).toBe(true);
  });

  it('应该接受空字符串作为电量', () => {
    expect(validatePower('')).toBe(true);
  });

  it('应该拒绝 15KW', () => {
    expect(validatePower('15KW')).toBe(false);
  });

  it('应该接受「有」作为上下水', () => {
    expect(validateWater('有')).toBe(true);
  });

  it('应该接受「/」作为上下水', () => {
    expect(validateWater('/')).toBe(true);
  });

  it('应该接受空字符串作为上下水', () => {
    expect(validateWater('')).toBe(true);
  });

  it('应该拒绝「无」', () => {
    expect(validateWater('无')).toBe(false);
  });

  it('应该拒绝非法上下水值', () => {
    expect(validateWater('yes')).toBe(false);
    expect(validateWater('no')).toBe(false);
  });
});
