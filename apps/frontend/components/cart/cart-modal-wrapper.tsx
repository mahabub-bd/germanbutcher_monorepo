"use client";


import { useCartContext } from "@/contexts/cart-context";

import type { Cart } from "@/utils/types";
import { CartModal } from "./cart-modal";

export function CartModalWrapper({ compact }: { compact?: boolean }) {
  const { cart } = useCartContext();

  return <CartModal cart={cart as Cart} compact={compact} />;
}
