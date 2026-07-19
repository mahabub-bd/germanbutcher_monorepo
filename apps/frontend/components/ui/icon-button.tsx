import { cn } from "@/lib/utils";
import React from "react";

// Solution 1: Using button element (recommended)
interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  count?: number;
  alwaysShowCount?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon, label, count, alwaysShowCount = false, className, ...props },
    ref
  ) => {
    const showCount =
      typeof count === "number" && (alwaysShowCount ? count >= 0 : count > 0);

    return (
      <button
        ref={ref}
        className={cn(
          "group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full p-0 border-0 bg-transparent focus:outline-none ",
          className
        )}
        aria-label={label}
        {...props}
      >
        {icon}
        {showCount && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full  px-1 text-[10px] font-semibold bg-white text-primaryColor">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

// Alternative Solution 2: Keep div but add proper role
interface IconButtonDivProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  label: string;
  count?: number;
  alwaysShowCount?: boolean;
}

export const IconButtonDiv = React.forwardRef<
  HTMLDivElement,
  IconButtonDivProps
>(
  (
    { icon, label, count, alwaysShowCount = false, className, ...props },
    ref
  ) => {
    const showCount =
      typeof count === "number" && (alwaysShowCount ? count >= 0 : count > 0);

    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full p-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            (e.target as HTMLElement).click();
          }
        }}
        {...props}
      >
        {icon}
        {showCount && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>
    );
  }
);

IconButtonDiv.displayName = "IconButtonDiv";
