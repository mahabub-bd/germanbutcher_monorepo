import { Info, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

// Tinted header styles for accent-colored form sections.
const sectionAccents: Record<string, { header: string; icon: string }> = {
  blue: {
    header: "bg-blue-50/80 dark:bg-blue-950/30",
    icon: "text-blue-600 dark:text-blue-400",
  },
  green: {
    header: "bg-emerald-50/80 dark:bg-emerald-950/30",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    header: "bg-amber-50/80 dark:bg-amber-950/30",
    icon: "text-amber-600 dark:text-amber-400",
  },
  purple: {
    header: "bg-purple-50/80 dark:bg-purple-950/30",
    icon: "text-purple-600 dark:text-purple-400",
  },
};

// Helper Components
const Section = ({
  title,
  children,
  icon: Icon,
  accent,
  action,
}: {
  title: string;
  children: React.ReactNode;
  /** Optional lucide icon shown in the card header. */
  icon?: LucideIcon;
  /** Accent color for the tinted header band; omit for the plain style. */
  accent?: keyof typeof sectionAccents;
  /** Optional content (e.g. a button) pinned to the header's right side. */
  action?: React.ReactNode;
}) => {
  const styles = accent ? sectionAccents[accent] : undefined;

  if (!styles) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="space-y-4">{children}</div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-5 py-3.5",
          styles.header
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <Icon className={cn("h-5 w-5 shrink-0", styles.icon)} />
          ) : null}
          <h3 className="truncate text-base font-semibold">{title}</h3>
        </div>
        {action ? (
          <div className="flex shrink-0 items-center gap-2">{action}</div>
        ) : null}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
};

const InfoBox = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="bg-muted/30 p-4 rounded-lg border border-muted flex items-start gap-3">
    <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
    <div className="text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p>{description}</p>
    </div>
  </div>
);

const SwitchCard = ({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) => (
  <div
    className={`flex items-center justify-between rounded-lg border p-4 ${className || ""}`}
  >
    <div className="space-y-0.5">
      <p className="text-base font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export { InfoBox, Section, SwitchCard };
