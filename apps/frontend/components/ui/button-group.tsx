import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const groupStyle = cva(
  "flex w-fit items-stretch [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative [&>[data-slot=button-group]]:has-[>[data-slot=button-group]]:gap-2",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*]:not-first:rounded-l-none [&>*]:not-last:rounded-r-none [&>[data-slot=button-group]:not(:last-child)]:rounded-r-md [&>[data-slot=button-group]:not(:first-child)]:rounded-l-md",
        vertical:
          "flex-col [&>*]:not-first:rounded-t-none [&>*]:not-last:rounded-b-none [&>[data-slot=button-group]:not(:last-child)]:rounded-b-md [&>[data-slot=button-group]:not(:first-child)]:rounded-t-md",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
);

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof groupStyle>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(groupStyle({ orientation }), className)}
      {...props}
    />
  );
}

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof groupStyle> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(groupStyle({ orientation: "horizontal" }), className)}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn("bg-input w-px self-stretch", className)}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText };
