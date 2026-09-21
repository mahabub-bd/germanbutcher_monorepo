import type { LucideIcon } from "lucide-react";

export interface FeatureItem {
  icon: LucideIcon;
  label: string;
  desc: string;
  /** Optional chip background/text classes, used by the "strip" variant. */
  chip?: string;
}

interface FeatureListProps {
  items: FeatureItem[];
  /**
   * "tile" — red-tinted rounded tiles shown inside the product info card.
   * "strip" — one bordered full-width card with hairline dividers.
   */
  variant?: "tile" | "strip";
}

/**
 * Icon + label + description list used for product highlights. The data
 * shape is identical everywhere; only the container styling differs.
 */
export function FeatureList({ items, variant = "strip" }: FeatureListProps) {
  if (variant === "tile") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {items.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-2 sm:gap-2.5 bg-red-50/60 rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5"
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primaryColor shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-gray-900 leading-tight">
                {label}
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-500 leading-tight mt-0.5">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, label, desc, chip }, index) => (
          <div
            key={label}
            className={`flex items-center gap-2 sm:gap-3 px-3 py-3 md:px-6 md:py-5 ${
              index % 2 === 1 ? "border-l border-gray-100" : ""
            } ${index >= 2 ? "border-t lg:border-t-0 border-gray-100" : ""} ${
              index > 0 ? "lg:border-l lg:border-gray-100" : ""
            }`}
          >
            <div
              className={`${chip ?? "bg-gray-50 text-primaryColor"} w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center shrink-0`}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-xs md:text-sm text-gray-900 leading-tight">
                {label}
              </h4>
              <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 leading-snug">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
