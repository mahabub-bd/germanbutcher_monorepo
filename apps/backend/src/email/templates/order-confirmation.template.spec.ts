import { generateOrderConfirmationHTML, OrderEmailData } from './order-confirmation.template';

const baseOrder: OrderEmailData = {
  orderNo: '2026-0123',
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  subtotal: 1500,
  shippingFee: 0,
  totalValue: 1500,
  shippingMethod: 'Home Delivery (Dhaka)',
  paymentMethod: 'Cash on Delivery',
  items: [
    {
      productName: 'Chicken Nuggets — 500g',
      quantity: 3,
      price: 350,
      unitDiscount: 50,
    },
    {
      productName: 'Beef Sausage',
      quantity: 1,
      price: 450,
    },
  ],
  bogo: [
    { campaignName: 'Buy 2 Get 1 on Chicken Nuggets', discountAmount: 350, freeUnits: 1 },
  ],
};

describe('generateOrderConfirmationHTML', () => {
  it('renders BOGO discount without the "BOGO — " prefix', () => {
    const html = generateOrderConfirmationHTML(baseOrder);
    expect(html).toContain('Buy 2 Get 1 on Chicken Nuggets (1 free):');
    expect(html).not.toContain('BOGO —');
  });

  it('keeps the mobile stacking hooks for the items table', () => {
    const html = generateOrderConfirmationHTML(baseOrder);
    expect(html).toContain('em-order-items');
    expect((html.match(/class="em-label"/g) ?? []).length).toBe(6); // 2 items x (qty, unit, total)
    expect(html).toContain('em-summary-spacer');
    expect(html).toContain('width=device-width');
  });

  it('renders item and coupon discounts', () => {
    const html = generateOrderConfirmationHTML({
      ...baseOrder,
      coupon: { code: 'SAVE50', discountAmount: 50 },
    });
    expect(html).toContain('Coupon (SAVE50)');
    expect(html).toContain('line-through');
    expect(html).toContain('Free Delivery');
  });
});
