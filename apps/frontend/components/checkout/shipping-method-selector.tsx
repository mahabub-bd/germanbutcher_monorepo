"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import type { ShippingMethod } from "@/utils/types";
import { CheckCircle2, Truck } from "lucide-react";

interface ShippingMethodSelectorProps {
  shippingMethods: ShippingMethod[];
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
  /** When a free-delivery campaign waives standard shipping */
  isFreeDelivery?: boolean;
  /** Returns the cost actually charged for a method (e.g. the area-wise
   *  delivery charge overriding the method's base cost). When omitted the
   *  method's own cost is shown. */
  getAdjustedCost?: (method: ShippingMethod) => number;
  /** Returns the delivery time shown for a method (e.g. the area/city/
   *  division delivery time overriding the method's own). When omitted the
   *  method's own deliveryTime is shown. */
  getDeliveryTime?: (method: ShippingMethod) => string;
}

export function ShippingMethodSelector({
  shippingMethods,
  selectedMethod,
  onSelectMethod,
  isFreeDelivery = false,
  getAdjustedCost,
  getDeliveryTime,
}: ShippingMethodSelectorProps) {
  return (
    <section className="space-y-3 rounded-lg border bg-white p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Shipping Method</h2>
        </div>
        {isFreeDelivery && (
          <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Free delivery unlocked
          </Badge>
        )}
      </div>

      {/* Options */}
      {shippingMethods.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-gray-50 px-3 py-4 text-center text-sm text-muted-foreground">
          No shipping methods are available for the selected area. Please
          choose a different area or contact support.
        </p>
      ) : (
      <RadioGroup
        value={selectedMethod}
        onValueChange={onSelectMethod}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {shippingMethods.map((method) => {
          const value = method.id.toString();
          const isSelected = selectedMethod === value;
          const isFree = isFreeDelivery && !method.isExcludedFromFreeDelivery;
          const baseCost = Number(method.cost || 0);
          const adjustedCost = getAdjustedCost
            ? getAdjustedCost(method)
            : baseCost;

          return (
            <div
              key={method.id}
              role="radio"
              aria-checked={isSelected}
              className={cn(
                "relative flex items-center justify-between gap-3 rounded-lg border p-3 transition-all",
                "cursor-pointer hover:border-gray-300 hover:bg-gray-50",
                isSelected &&
                  "border-primary ring-1 ring-primary bg-primary/5 hover:border-primary hover:bg-primary/5"
              )}
              onClick={() => onSelectMethod(value)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <RadioGroupItem value={value} id={`shipping-${method.id}`} />
                <Label
                  htmlFor={`shipping-${method.id}`}
                  className="cursor-pointer space-y-0.5 min-w-0"
                >
                  <span className="block truncate font-medium text-sm">
                    {method.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {getDeliveryTime ? getDeliveryTime(method) : method.deliveryTime}
                  </span>
                </Label>
              </div>

              {isFree ? (
                <span className="flex flex-col items-end shrink-0">
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCurrencyEnglish(baseCost)}
                  </span>
                  <span className="font-semibold text-sm text-green-600 dark:text-green-400">
                    FREE
                  </span>
                </span>
              ) : (
                <span className="flex flex-col items-end gap-0.5 shrink-0">
                  <span
                    className={cn(
                      "font-semibold text-sm",
                      isSelected && "text-primary"
                    )}
                  >
                    {formatCurrencyEnglish(adjustedCost)}
                  </span>
                  {isFreeDelivery && (
                    <span className="text-[10px] leading-tight text-amber-600 dark:text-amber-400 text-right">
                      Free delivery not applicable
                    </span>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </RadioGroup>
      )}
    </section>
  );
}
