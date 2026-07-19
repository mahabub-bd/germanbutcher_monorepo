// components/IconRenderer.tsx
import { cn } from "@/lib/utils"; // Assuming you're using the utils from shadcn/ui
import * as LucideIcons from "lucide-react";
import { ComponentType, SVGProps } from "react";

interface IconRendererProps extends SVGProps<SVGSVGElement> {
  name: string;
  className?: string;
  size?: number;
  collapsed?: boolean;
}

// Create a type for all available Lucide icon names
type LucideIconName = keyof typeof LucideIcons;

// Type guard with more specific typing
function isLucideIcon(iconName: string): iconName is LucideIconName {
  return iconName in LucideIcons;
}

export const IconRenderer = ({
  name,
  className,
  size = 18,
  collapsed = false,
  ...props
}: IconRendererProps) => {
  if (!isLucideIcon(name)) {
    console.warn(`Icon "${name}" not found in Lucide Icons`);
    return null;
  }

  const IconComponent = LucideIcons[name] as ComponentType<
    SVGProps<SVGSVGElement> & {
      className?: string;
      size?: number | string;
    }
  >;

  return (
    <IconComponent
      className={cn(
        "h-5 w-5 shrink-0 transition-all duration-200",
        collapsed ? "mr-0" : "mr-2",
        className
      )}
      size={size}
      {...props}
    />
  );
};
