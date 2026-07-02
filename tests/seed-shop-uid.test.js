import { describe, expect, it } from 'vitest';

const { buildSeedShopUid } = await import('../prisma/seed.js');

describe('默认数据 seed shopUid', () => {
  it('应该为同站重复 shortNo 的商铺生成稳定且唯一的 shopUid', () => {
    const first = buildSeedShopUid('huaqiao', { shortNo: '待定', no: 1 }, 0);
    const second = buildSeedShopUid('huaqiao', { shortNo: '待定', no: 2 }, 1);

    expect(first).toMatch(/^shop_[a-f0-9]{24}$/);
    expect(second).toMatch(/^shop_[a-f0-9]{24}$/);
    expect(first).not.toBe(second);
    expect(buildSeedShopUid('huaqiao', { shortNo: '待定', no: 1 }, 0)).toBe(first);
  });
});
