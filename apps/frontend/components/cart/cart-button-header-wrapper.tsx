"use client";

import { CartButtonHeader } from "@/components/cart/cart-button-header";
import { useCartContext } from "@/contexts/cart-context";

import type { Cart } from "@/utils/types";

export function CartButtonHeaderWrapper({ compact }: { compact?: boolean }) {
  const { cart } = useCartContext();

  return <CartButtonHeader cart={cart as Cart} compact={compact} />;
}
