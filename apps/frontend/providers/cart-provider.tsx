"use client";

import { CartContext } from "@/contexts/cart-context";
import { useCart } from "@/hooks/use-cart";
import type { Cart } from "@/utils/types";
import type { ReactNode } from "react";

type CartProviderProps = {
  children: ReactNode;
  serverCart?: Cart;
  isLoggedIn: boolean;
};

export function CartProvider({
  children,
  serverCart,
  isLoggedIn,
}: CartProviderProps) {
  const cartUtils = useCart({ serverCart, isLoggedIn });

  const cartContextValue = {
    ...cartUtils,
    cart: cartUtils.cart ?? { items: [] },
  };

  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
    </CartContext.Provider>
  );
}
