import {
  applyBogoDiscount,
  BogoPricingDetail,
} from './bogo-campaigns.service';

function makeCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Test BOGO',
    isActive: true,
    validFrom: null,
    validUntil: null,
    buyQuantity: 2,
    getQuantity: 1,
    maxUsage: 0,
    timesUsed: 0,
    products: [],
    categories: [],
    ...overrides,
  } as any;
}

function makeDetail(
  productId: number,
  quantity: number,
  unitPrice: number,
  categoryId?: number,
): BogoPricingDetail {
  return {
    productId,
    quantity,
    unitPrice,
    unitDiscount: 0,
    totalPrice: quantity * unitPrice,
    categoryId,
  };
}

describe('applyBogoDiscount', () => {
  it('buy 2 get 1, qty 3 -> 1 free (cheapest unit)', () => {
    const d1 = makeDetail(10, 3, 100);
    const result = applyBogoDiscount([d1], [makeCampaign()]);
    expect(result.totalDiscount).toBe(100);
    expect(d1.totalPrice).toBe(200);
    expect(d1.unitDiscount).toBeCloseTo(100 / 3, 2);
  });

  it('buy 2 get 1, qty 5 -> 1 free (overhang stays paid)', () => {
    const d1 = makeDetail(10, 5, 100);
    const result = applyBogoDiscount([d1], [makeCampaign()]);
    expect(result.totalDiscount).toBe(100);
    expect(d1.totalPrice).toBe(400);
  });

  it('buy 2 get 1, qty 6 -> 2 free', () => {
    const d1 = makeDetail(10, 6, 100);
    const result = applyBogoDiscount([d1], [makeCampaign()]);
    expect(result.totalDiscount).toBe(200);
    expect(d1.totalPrice).toBe(400);
  });

  it('cheapest-first across lines of one product set', () => {
    const d1 = makeDetail(10, 3, 100);
    const d2 = makeDetail(10, 1, 50);
    const result = applyBogoDiscount([d1, d2], [makeCampaign()]);
    // 4 units pooled -> 1 free = the 50 unit
    expect(result.totalDiscount).toBe(50);
    expect(d2.totalPrice).toBe(0);
  });

  it('cross-product pooling via category scope', () => {
    const d1 = makeDetail(10, 1, 100, 5);
    const d2 = makeDetail(11, 2, 80, 5);
    const result = applyBogoDiscount([d1, d2], [makeCampaign({
      products: [],
      categories: [{ id: 5 }],
    })]);
    expect(result.totalDiscount).toBe(80);
    expect(d2.totalPrice).toBe(80); // one 80 unit free
  });

  it('no eligible units -> no discount', () => {
    const d1 = makeDetail(10, 5, 100);
    const result = applyBogoDiscount(
      [d1],
      [makeCampaign({ products: [{ id: 999 }], categories: [] })],
    );
    expect(result.totalDiscount).toBe(0);
    expect(d1.totalPrice).toBe(500);
  });

  it('ledger: two overlapping campaigns never consume the same unit twice', () => {
    const d1 = makeDetail(10, 3, 100);
    const result = applyBogoDiscount([d1], [
      makeCampaign({ id: 1 }),
      makeCampaign({ id: 2 }),
    ]);
    // Campaign 1 takes the single free unit; campaign 2 has 0 remaining
    // eligible units -> no second free unit.
    expect(result.totalDiscount).toBe(100);
    expect(result.usages).toHaveLength(1);
  });
});
