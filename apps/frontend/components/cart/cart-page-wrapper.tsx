"use client";

import type { Cart } from "@/utils/types";

import { useCartContext } from "@/contexts/cart-context";
import { CartPage } from "./cart-page";

export function CartPageWrapper() {
  const { cart } = useCartContext();

  return <CartPage cart={cart as Cart} />;
}
