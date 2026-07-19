import type { Product } from '@/utils/types';

export const hasActiveDiscount = (product: Product): boolean => {
  if (!product.discountType || !product.discountValue) return false;

  const now = new Date();
  const discountStart = new Date(product.discountStartDate || 0);
  const discountEnd = new Date(product.discountEndDate || 0);

  return now >= discountStart && now <= discountEnd;
};

export const getDiscountedPrice = (product: Product): number => {
  if (!hasActiveDiscount(product)) return product.sellingPrice;

  const discountAmount =
    product.discountType === 'fixed'
      ? Number.parseFloat(String(product.discountValue ?? '0'))
      : (product.sellingPrice *
          Number.parseFloat(String(product.discountValue ?? '0'))) /
        100;

  return Math.max(0, product.sellingPrice - discountAmount);
};

export const getDiscountLabel = (product: Product): string => {
  if (!hasActiveDiscount(product)) return '';

  return product.discountType === 'fixed'
    ? `$${product.discountValue} OFF`
    : `${product.discountValue}% OFF`;
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
