"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-4", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "group relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-background text-primary transition-all duration-200 ease-in-out outline-none border-0",
        "hover:bg-primaryColor/5 hover:scale-105",
        "focus-visible:ring-2 focus-visible:ring-primaryColor/20 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background disabled:hover:scale-100",
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-lg data-[state=checked]:shadow-primaryColor/25 data-[state=checked]:border-0",
        "aria-invalid:bg-destructive/10 aria-invalid:text-destructive",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="size-2.5 fill-current text-primary-foreground transition-all duration-200 ease-in-out" />
      </RadioGroupPrimitive.Indicator>

      {/* Background circle for visual enhancement */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-muted/30 transition-all duration-200 ease-in-out",
          "group-hover:bg-primaryColor/10 group-hover:scale-110",
          "group-data-[state=checked]:bg-primaryColor/20 group-data-[state=checked]:scale-100"
        )}
      />
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
