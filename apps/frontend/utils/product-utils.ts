import { DiscountType, type Product } from '@/utils/types';

/** Active flash sale covering the product? Trusts the backend-computed
 * `flashSale` flag; the client never re-validates maxUsage. */
export const isFlashSaleActive = (product: Product): boolean => {
  if (!product.flashSale) return false;
  if (!product.flashSale.endsAt) return true;
  return new Date() <= new Date(product.flashSale.endsAt);
};

/** Price under the flash sale campaign alone. */
export const getFlashPrice = (product: Product): number => {
  if (!product.flashSale) return product.sellingPrice;
  const { discountType, discountValue } = product.flashSale;
  const discountAmount =
    discountType === 'fixed'
      ? Number.parseFloat(String(discountValue ?? '0'))
      : (product.sellingPrice *
          Number.parseFloat(String(discountValue ?? '0'))) /
        100;
  return Math.max(0, product.sellingPrice - discountAmount);
};

/** Single price authority on the client: flash sale > product discount >
 * selling price (mirrors the backend order-time math). Prefers the
 * backend-computed `effectivePrice` when present. */
export const getEffectivePrice = (product: Product): number => {
  if (typeof product.effectivePrice === 'number') return product.effectivePrice;
  if (isFlashSaleActive(product)) return getFlashPrice(product);
  return getDiscountedPrice(product);
};

/** Whether any discount (flash or per-product) currently applies. */
export const hasActiveDiscount = (product: Product): boolean =>
  isFlashSaleActive(product) || hasProductDiscount(product);

/** Per-product discount active (ignores flash sale). */
export const hasProductDiscount = (product: Product): boolean => {
  if (!product.discountType || !product.discountValue) return false;

  const now = new Date();
  const discountStart = new Date(product.discountStartDate || 0);
  const discountEnd = new Date(product.discountEndDate || 0);

  return now >= discountStart && now <= discountEnd;
};

export const getDiscountedPrice = (product: Product): number => {
  if (!hasProductDiscount(product)) return product.sellingPrice;

  const discountAmount =
    product.discountType === 'fixed'
      ? Number.parseFloat(String(product.discountValue ?? '0'))
      : (product.sellingPrice *
          Number.parseFloat(String(product.discountValue ?? '0'))) /
        100;

  return Math.max(0, product.sellingPrice - discountAmount);
};

export const getDiscountLabel = (product: Product): string => {
  if (!hasProductDiscount(product)) return '';

  return product.discountType === 'fixed'
    ? `৳${Number.parseFloat(String(product.discountValue))} OFF`
    : `${Number.parseFloat(String(product.discountValue))}% OFF`;
};

/** Label for whichever discount is currently active: flash sale takes
 * precedence, then per-product discount. */
export const getActiveDiscountLabel = (product: Product): string => {
  if (isFlashSaleActive(product) && product.flashSale) {
    return product.flashSale.discountType === DiscountType.FIXED
      ? `৳${Number.parseFloat(String(product.flashSale.discountValue))} OFF`
      : `${Number.parseFloat(String(product.flashSale.discountValue))}% OFF`;
  }
  return getDiscountLabel(product);
};

export const getStockStatus = (stock: number) => {
  if (stock === 0)
    return { message: 'Out of stock', className: 'text-red-600' };
  if (stock <= 5)
    return {
      message: `Only ${stock} left in stock`,
      className: 'text-orange-600',
    };
  return null;
};
