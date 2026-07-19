import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type HeadingProps = {
  title: string;
  subtitle?: string | ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeVariants = {
  sm: {
    title: "text-xl md:text-2xl lg:text-3xl",
    subtitle: "text-sm md:text-base lg:text-lg",
  },
  md: {
    title: "text-2xl md:text-3xl lg:text-4xl",
    subtitle: "text-base md:text-lg lg:text-xl",
  },
  lg: {
    title: "text-3xl md:text-4xl lg:text-5xl",
    subtitle: "text-base md:text-lg lg:text-xl",
  },
  xl: {
    title: "text-4xl md:text-5xl lg:text-6xl xl:text-7xl",
    subtitle: "text-lg md:text-xl lg:text-2xl",
  },
};

const alignVariants = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function HeadingPrimary({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
  align = "center",
  size = "lg",
}: HeadingProps) {
  const sizeClasses = sizeVariants[size];
  const alignClass = alignVariants[align];

  return (
    <div className={cn(alignClass, "space-y-2", className)}>
      <h2
        className={cn(
          "text-primaryColor font-castor font-normal leading-tight tracking-tight",
          sizeClasses.title,
          titleClassName
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "text-muted-foreground leading-relaxed max-w-2xl",
            align === "center" && "mx-auto",
            sizeClasses.subtitle,
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
