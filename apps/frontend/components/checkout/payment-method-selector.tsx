"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { cashOnDelivery, SSLcomarz } from "@/public/images";
import { PaymentMethod } from "@/utils/types";
import { CreditCard } from "lucide-react";
import Image, { StaticImageData } from "next/image";

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedMethod: string;
  onSelectMethod: (methodCode: string) => void;
}

type PaymentMethodImages = {
  [key: string]: StaticImageData;
};

const PAYMENT_METHOD_IMAGES: PaymentMethodImages = {
  SSLCOMMERZ: SSLcomarz,
  "Cash on Delivery": cashOnDelivery,
};

export function PaymentMethodSelector({
  paymentMethods,
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Payment Method</h2>
      </div>

      {/* Payment Options */}
      <RadioGroup
        value={selectedMethod}
        onValueChange={onSelectMethod}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {paymentMethods.map((method) => {
          const imageSrc = PAYMENT_METHOD_IMAGES[method.name];
          const isSelected = selectedMethod === method.code;

          return (
            <div
              key={method.id}
              className={cn(
                "flex items-center justify-between rounded-md border p-3 transition-all cursor-pointer",
                "hover:bg-gray-50",
                isSelected && "border-primary bg-primary/5"
              )}
              onClick={() => onSelectMethod(method.code)}
            >
              {/* Left Side: Radio + Method Name */}
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  value={method.code}
                  id={`payment-${method.id}`}
                />

                <Label
                  htmlFor={`payment-${method.id}`}
                  className="cursor-pointer flex flex-col"
                >
                  <span className="font-medium text-sm">{method.name}</span>
                  {!method.isActive && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-xs mt-1"
                    >
                      Inactive
                    </Badge>
                  )}
                </Label>
              </div>

              {/* Right Side: Image */}
              {imageSrc && (
                <Image
                  src={imageSrc}
                  alt={method.name}
                  width={200}
                  height={200}
                  className="w-14 md:w-16 h-auto object-contain"
                />
              )}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
