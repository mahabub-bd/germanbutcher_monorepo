"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import type { ShippingMethod } from "@/utils/types";
import { Truck } from "lucide-react";

interface ShippingMethodSelectorProps {
  shippingMethods: ShippingMethod[];
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
}

export function ShippingMethodSelector({
  shippingMethods,
  selectedMethod,
  onSelectMethod,
}: ShippingMethodSelectorProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Shipping Method</h2>
      </div>

      {/* Radio Options */}
      <RadioGroup
        value={selectedMethod}
        onValueChange={onSelectMethod}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {shippingMethods.map((method) => {
          const isSelected = selectedMethod === method.id.toString();
          return (
            <div
              key={method.id}
              className={cn(
                "flex items-center justify-between rounded-md border p-3 transition-all",
                "hover:bg-gray-50 cursor-pointer",
                isSelected && "border-primary bg-primary/5"
              )}
              onClick={() => onSelectMethod(method.id.toString())}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem
                  value={method.id.toString()}
                  id={`shipping-${method.id}`}
                />
                <Label
                  htmlFor={`shipping-${method.id}`}
                  className="cursor-pointer"
                >
                  <p className="font-medium text-sm">{method.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.deliveryTime}
                  </p>
                </Label>
              </div>

              <span className="font-medium text-sm md:text-base">
                {formatCurrencyEnglish(Number(method.cost))}
              </span>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
