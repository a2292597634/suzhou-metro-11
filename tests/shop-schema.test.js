/**
 * Shop Schema 测试 — 验证 power/water 新增字段的 Zod 校验
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// 从 server.js 复制的 Zod schemas（含新增 power/water）
const shopSchema = z.object({
  no: z.number().int().min(0),
  shortNo: z.string().max(50).optional().default(''),
  name: z.string().min(1).max(200),
  type: z.string().max(50).optional().default('商铺'),
  area: z.number().min(0).optional().default(0),
  tenant: z.string().max(100).optional().default(''),
  contact: z.string().max(100).optional().default(''),
  openDate: z.string().max(50).optional().default(''),
  status: z.enum(['营业中', '未出租', '装修中']).optional().default('未出租'),
  power: z.union([z.enum(['20KW', '30KW']), z.literal('')]).optional().default(''),
  water: z.union([z.enum(['有', '/']), z.literal('')]).optional().default('/'),
  remark: z.string().max(500).optional().default('')
});

describe('Shop Schema - power/water 字段校验', () => {
  const validShop = {
    no: 1,
    shortNo: 'S11-1',
    name: 'A商铺',
    type: '商铺',
    area: 18.69,
    tenant: '测试商户',
    contact: '',
    openDate: '',
    status: '营业中',
    power: '20KW',
    water: '有',
    remark: ''
  };

  describe('power 字段', () => {
    it('应该接受 20KW', () => {
      const result = shopSchema.safeParse({ ...validShop, power: '20KW' });
      expect(result.success).toBe(true);
    });

    it('应该接受 30KW', () => {
      const result = shopSchema.safeParse({ ...validShop, power: '30KW' });
      expect(result.success).toBe(true);
    });

    it('应该拒绝 15KW（不在枚举值中）', () => {
      const result = shopSchema.safeParse({ ...validShop, power: '15KW' });
      expect(result.success).toBe(false);
    });

    it('应该接受空字符串（optional 默认值）', () => {
      const result = shopSchema.safeParse({ ...validShop, power: '' });
      expect(result.success).toBe(true);
    });

    it('应该接受未传 power 字段（optional）', () => {
      const { power, ...withoutPower } = validShop;
      const result = shopSchema.safeParse(withoutPower);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.power).toBe('');
      }
    });
  });

  describe('water 字段', () => {
    it('应该接受「有」', () => {
      const result = shopSchema.safeParse({ ...validShop, water: '有' });
      expect(result.success).toBe(true);
    });

    it('应该接受「/」', () => {
      const result = shopSchema.safeParse({ ...validShop, water: '/' });
      expect(result.success).toBe(true);
    });

    it('应该拒绝「无」', () => {
      const result = shopSchema.safeParse({ ...validShop, water: '无' });
      expect(result.success).toBe(false);
    });

    it('应该接受未传 water 字段（optional 默认值）', () => {
      const { water, ...withoutWater } = validShop;
      const result = shopSchema.safeParse(withoutWater);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.water).toBe('/');
      }
    });
  });
});
