"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { cashOnDelivery, SSLcomarz } from "@/public/images";
import { PaymentMethod } from "@/utils/types";
import { CreditCard, ShieldCheck } from "lucide-react";
import Image, { StaticImageData } from "next/image";

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedMethod: string;
  onSelectMethod: (methodCode: string) => void;
  /** Methods that can't be used right now, with the reason shown inline */
  disabledMethods?: { code: string; reason: string }[];
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
  disabledMethods = [],
}: PaymentMethodSelectorProps) {
  const getDisabledReason = (code: string) =>
    disabledMethods.find((m) => m.code === code)?.reason;

  return (
    <section className="space-y-3 rounded-lg border bg-white p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Payment Method</h2>
      </div>

      {/* Options */}
      <RadioGroup
        value={selectedMethod}
        onValueChange={onSelectMethod}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {paymentMethods.map((method) => {
          const imageSrc = PAYMENT_METHOD_IMAGES[method.name];
          const isSelected = selectedMethod === method.code;
          const disabledReason = getDisabledReason(method.code);
          const isDisabled = Boolean(disabledReason);

          return (
            <div
              key={method.id}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border p-3 transition-all",
                isDisabled
                  ? "cursor-not-allowed bg-gray-50 opacity-60"
                  : "cursor-pointer hover:border-gray-300 hover:bg-gray-50",
                isSelected &&
                  !isDisabled &&
                  "border-primary ring-1 ring-primary bg-primary/5 hover:border-primary hover:bg-primary/5"
              )}
              onClick={() => {
                if (!isDisabled) onSelectMethod(method.code);
              }}
            >
              {/* Left: Radio + Name + Description */}
              <div className="flex items-center gap-3 min-w-0">
                <RadioGroupItem
                  value={method.code}
                  id={`payment-${method.id}`}
                  disabled={isDisabled}
                />
                <Label
                  htmlFor={`payment-${method.id}`}
                  className={cn(
                    "space-y-0.5 min-w-0",
                    isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <span className="block font-medium text-sm">
                    {method.name}
                  </span>
                  {method.description && (
                    <span className="block text-xs text-muted-foreground truncate">
                      {method.description}
                    </span>
                  )}
                  {disabledReason && (
                    <span className="block text-[11px] leading-tight text-amber-600 dark:text-amber-400">
                      {disabledReason}
                    </span>
                  )}
                </Label>
              </div>

              {/* Right: Logo */}
              {imageSrc && (
                <Image
                  src={imageSrc}
                  alt={method.name}
                  width={200}
                  height={200}
                  className={cn(
                    "w-12 md:w-14 h-auto object-contain shrink-0",
                    isDisabled && "grayscale"
                  )}
                />
              )}
            </div>
          );
        })}
      </RadioGroup>

      {/* Trust footer */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
        Payments are secure and encrypted
      </p>
    </section>
  );
}
