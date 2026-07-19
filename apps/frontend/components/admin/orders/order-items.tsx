"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrencyEnglish } from "@/lib/utils";
import type { OrderItem } from "@/utils/types";
import { Package } from "lucide-react";
import Image from "next/image";

interface OrderItemsProps {
  items: OrderItem[];
}

export function OrderItems({ items }: OrderItemsProps) {
  return (
    <div className="border rounded-lg bg-card shadow-sm">
      <div className="px-4 py-3 border-b">
          <h3 className="text-base font-semibold flex items-center">
          <Package className="size-4 mr-1.5 text-primary" />
          Order Items
          <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5">
            {items.length}
          </Badge>
        </h3>
      </div>

      <div className="p-3 space-y-2">
        {items.map((item: OrderItem) => {
          const unitPrice =
            Number(item.unitPrice) || Number(item.product.sellingPrice) || 0;
          const totalPrice =
            Number(item.totalPrice) || unitPrice * item.quantity;
          const unitDiscount = Number(item.unitDiscount) || 0;

          return (
            <div
              key={item.id}
              className="group flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="relative size-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={item.product.attachment?.url || "/placeholder.svg"}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium line-clamp-1">
                      {item.product.name}
                    </h4>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatCurrencyEnglish(unitPrice)} × {item.quantity}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {parseInt(String(item.product.weight || 0))}{" "}
                        {item.product.unit?.name?.toLowerCase()}
                      </span>
                      {unitDiscount > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">
                          -{formatCurrencyEnglish(unitDiscount * item.quantity)}
                        </Badge>
                      )}
                    </div>

                    {item.product.supplier && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Supplier: {item.product.supplier.name}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">
                      {formatCurrencyEnglish(totalPrice)}
                    </p>
                    {unitDiscount > 0 && (
                      <p className="text-[10px] text-muted-foreground line-through">
                        {formatCurrencyEnglish(
                          (unitPrice + unitDiscount) * item.quantity
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
