/**
 * Shop Schema 测试 — 验证 power/water 新增字段的 Zod 校验
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// 从 server.js 复制的 Zod schemas（与真实 server.js 保持一致）
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
  remark: z.string().max(500).optional().default(''),
  photo: z.string().max(3_000_000).refine(
    (v) => v === '' || /^data:image\/(jpeg|png|webp);base64,/.test(v),
    { message: 'photo 必须为空字符串或 data:image/(jpeg|png|webp);base64,... Data URL' }
  ).optional().default('')
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

  describe('photo 字段', () => {
    it('应该接受空字符串作为默认值', () => {
      const result = shopSchema.safeParse({ ...validShop, photo: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.photo).toBe('');
      }
    });

    it('应该接受未传 photo 字段（optional 默认空字符串）', () => {
      const { photo, ...withoutPhoto } = validShop;
      const result = shopSchema.safeParse(withoutPhoto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.photo).toBe('');
      }
    });

    it('应该接受合法的 data:image/jpeg;base64 Data URL', () => {
      const result = shopSchema.safeParse({
        ...validShop,
        photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      });
      expect(result.success).toBe(true);
    });

    it('应该接受合法的 data:image/png;base64 Data URL', () => {
      const result = shopSchema.safeParse({
        ...validShop,
        photo: 'data:image/png;base64,iVBORw0KGgo=='
      });
      expect(result.success).toBe(true);
    });

    it('应该接受合法的 data:image/webp;base64 Data URL', () => {
      const result = shopSchema.safeParse({
        ...validShop,
        photo: 'data:image/webp;base64,UklGRg=='
      });
      expect(result.success).toBe(true);
    });

    it('应该拒绝非 data:image URL 的普通字符串', () => {
      const result = shopSchema.safeParse({
        ...validShop,
        photo: 'not-a-data-url'
      });
      expect(result.success).toBe(false);
    });

    it('应该拒绝 data:text/html Data URL', () => {
      const result = shopSchema.safeParse({
        ...validShop,
        photo: 'data:text/html,<p>hello</p>'
      });
      expect(result.success).toBe(false);
    });

    it('应该拒绝 data:image/gif Data URL（不支持的格式）', () => {
      const result = shopSchema.safeParse({
        ...validShop,
        photo: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP=='
      });
      expect(result.success).toBe(false);
    });

    // --- Green 阶段：修复后验证 ---

    it('应该接受 500 字符以上合法 Data URL', () => {
      // 构造一个 ~600 字符的合法 JPEG Data URL
      const longPhoto = 'data:image/jpeg;base64,' + 'A'.repeat(580);
      const result = shopSchema.safeParse({ ...validShop, photo: longPhoto });
      expect(result.success).toBe(true);
    });

    it('应该拒绝 /assets/shop-photos/demo.png 路径型照片值', () => {
      const result = shopSchema.safeParse({
        ...validShop,
        photo: '/assets/shop-photos/demo.png'
      });
      expect(result.success).toBe(false);
    });

    it('应该拒绝超过 3_000_000 字符的照片字段', () => {
      const tooLong = 'data:image/jpeg;base64,' + 'A'.repeat(3_000_001);
      const result = shopSchema.safeParse({ ...validShop, photo: tooLong });
      expect(result.success).toBe(false);
    });

    it('应该接受长度恰好 3_000_000 字符的合法 Data URL', () => {
      const prefixLen = 'data:image/jpeg;base64,'.length;
      const longPhoto = 'data:image/jpeg;base64,' + 'A'.repeat(3_000_000 - prefixLen);
      const result = shopSchema.safeParse({ ...validShop, photo: longPhoto });
      expect(result.success).toBe(true);
    });
  });
});
