import { CartItemProductPage } from "@/components/cart/cart-item-product-page";
import type { CartItem } from "@/utils/types";
import { Package } from "lucide-react";

interface OrderItemsProps {
  items: CartItem[];
  itemCount: number;
}

export function OrderItems({ items, itemCount }: OrderItemsProps) {
  return (
    <div className="space-y-4 md:space-y-5 bg-white rounded-lg border p-4 md:p-6">
      <div className="flex items-center gap-2 border-b pb-3 md:pb-4">
        <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        <div>
          <h2 className="text-base md:text-lg font-semibold">
            Order Items ({itemCount})
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Review your items before placing your order
          </p>
        </div>
      </div>

      <div className="space-y-4 divide-y">
        {items.map((item: CartItem) => (
          <div key={item.product.id} className="pt-4 first:pt-0">
            <CartItemProductPage item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
