import { PolicyContactLinks } from "@/components/common/policy-contact-links";
import { cn } from "@/lib/utils";
import type { BusinessSettings } from "@/utils/types";
import { AlertTriangle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

/** Icon component accepted by every policy primitive. Lucide icons satisfy it. */
export type PolicyIcon = ComponentType<{ className?: string }>;

/** Semantic colour families used across the policy documents. Keeping the map in
 *  one place is what makes Terms / Privacy / Return-Refund look identical. */
export type PolicyTone =
  "neutral" | "brand" | "info" | "success" | "warning" | "danger";

const CALLOUT_TONES: Record<
  PolicyTone,
  { shell: string; title: string; body: string; icon: string }
> = {
  neutral: {
    shell: "border-slate-200 bg-slate-50",
    title: "text-slate-900",
    body: "text-slate-700",
    icon: "text-slate-500",
  },
  brand: {
    shell: "border-primaryColor/15 bg-primaryColor/[0.04]",
    title: "text-primaryColor",
    body: "text-gray-700",
    icon: "text-primaryColor/70",
  },
  info: {
    shell: "border-sky-200 bg-sky-50",
    title: "text-sky-900",
    body: "text-sky-800",
    icon: "text-sky-600",
  },
  success: {
    shell: "border-emerald-200 bg-emerald-50",
    title: "text-emerald-900",
    body: "text-emerald-800",
    icon: "text-emerald-600",
  },
  warning: {
    shell: "border-amber-200 bg-amber-50",
    title: "text-amber-900",
    body: "text-amber-800",
    icon: "text-amber-600",
  },
  danger: {
    shell: "border-rose-200 bg-rose-50",
    title: "text-rose-900",
    body: "text-rose-800",
    icon: "text-rose-600",
  },
};

const TILE_TONES: Record<PolicyTone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  brand: "bg-primaryColor/[0.07] text-primaryColor ring-primaryColor/15",
  info: "bg-sky-50 text-sky-600 ring-sky-200",
  success: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  warning: "bg-amber-50 text-amber-600 ring-amber-200",
  danger: "bg-rose-50 text-rose-600 ring-rose-200",
};

/** Small tinted square that carries a section or card icon. */
export function PolicyIconTile({
  icon: Icon,
  tone = "brand",
  size = "md",
  className,
}: {
  icon?: PolicyIcon;
  tone?: PolicyTone;
  size?: "sm" | "md";
  className?: string;
}) {
  if (!Icon) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-xl ring-1",
        size === "md" ? "size-10" : "size-8",
        TILE_TONES[tone],
        className
      )}
    >
      <Icon className={size === "md" ? "size-5" : "size-4"} />
    </span>
  );
}

/** One numbered block of the document: heading + body. `id` is the TOC anchor. */
export function PolicySection({
  id,
  index,
  icon,
  title,
  description,
  tone = "brand",
  className,
  children,
}: {
  id: string;
  index?: number;
  icon?: PolicyIcon;
  title: string;
  description?: ReactNode;
  tone?: PolicyTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6",
        className
      )}
    >
      <header className="flex items-start gap-3 border-b border-gray-100 pb-4">
        <PolicyIconTile icon={icon} tone={tone} />
        <div className="min-w-0">
          <h2 className="text-base leading-snug font-semibold text-gray-900 sm:text-lg">
            {typeof index === "number" && (
              <span className="mr-2 text-xs font-bold tracking-wider text-primaryColor/50 tabular-nums sm:text-sm">
                {String(index).padStart(2, "0")}
              </span>
            )}
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
              {description}
            </p>
          )}
        </div>
      </header>

      <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600 sm:mt-5 sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}

/** Tinted emphasis block with an optional heading. Tone drives the colour. */
export function PolicyCallout({
  tone = "neutral",
  icon: Icon,
  title,
  className,
  children,
}: {
  tone?: PolicyTone;
  icon?: PolicyIcon;
  title?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const styles = CALLOUT_TONES[tone];
  return (
    <div
      className={cn("rounded-xl border p-3.5 sm:p-4", styles.shell, className)}
    >
      {title && (
        <h3
          className={cn(
            "flex items-center gap-2 text-sm font-semibold sm:text-base",
            styles.title,
            children ? "mb-2" : ""
          )}
        >
          {Icon && <Icon className={cn("size-4 shrink-0", styles.icon)} />}
          <span className="min-w-0">{title}</span>
        </h3>
      )}
      {children && (
        <div className={cn("space-y-2 text-sm leading-relaxed", styles.body)}>
          {children}
        </div>
      )}
    </div>
  );
}

type PolicyListVariant = "dot" | "check" | "cross" | "number" | "warning";

const LIST_TONE_MARK: Record<PolicyListVariant, PolicyTone> = {
  dot: "brand",
  check: "success",
  cross: "danger",
  number: "brand",
  warning: "warning",
};

/** Bullet list with a consistent marker; `variant` picks the glyph. */
export function PolicyList({
  items,
  variant = "dot",
  tone,
  className,
}: {
  items: ReactNode[];
  variant?: PolicyListVariant;
  tone?: PolicyTone;
  className?: string;
}) {
  const markTone = CALLOUT_TONES[tone ?? LIST_TONE_MARK[variant]];

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2.5">
          {variant === "number" ? (
            <span
              className={cn(
                "mt-px grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums ring-1",
                TILE_TONES[tone ?? "brand"]
              )}
            >
              {index + 1}
            </span>
          ) : variant === "dot" ? (
            <span
              aria-hidden
              className={cn(
                "mt-[9px] size-1.5 shrink-0 rounded-full",
                "bg-current",
                markTone.icon
              )}
            />
          ) : (
            <span className="mt-0.5 shrink-0">
              {variant === "check" ? (
                <CheckCircle2 className={cn("size-4", markTone.icon)} />
              ) : variant === "cross" ? (
                <XCircle className={cn("size-4", markTone.icon)} />
              ) : (
                <AlertTriangle className={cn("size-4", markTone.icon)} />
              )}
            </span>
          )}
          <span className="min-w-0 flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Label + explanation rows, e.g. "Order Cancellation: you can cancel …". */
export function PolicyDefinitions({
  items,
  className,
}: {
  items: { term: ReactNode; description: ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={cn("space-y-2.5", className)}>
      {items.map((item, index) => (
        <div key={index} className="sm:grid sm:grid-cols-[11rem_1fr] sm:gap-3">
          <dt className="text-sm font-semibold">{item.term}</dt>
          <dd className="text-sm leading-relaxed">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Responsive card grid used with `PolicyInfoCard`. */
export function PolicyCardGrid({
  columns = 2,
  className,
  children,
}: {
  columns?: 2 | 3 | 4;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PolicyInfoCard({
  icon,
  eyebrow,
  badge,
  title,
  description,
  tone = "neutral",
  className,
}: {
  icon?: PolicyIcon;
  eyebrow?: ReactNode;
  badge?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: PolicyTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-full rounded-xl border p-4 transition-shadow",
        CALLOUT_TONES[tone].shell,
        "hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && <PolicyIconTile icon={icon} tone={tone} size="sm" />}
        <div className="min-w-0">
          {(eyebrow || badge) && (
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {eyebrow && (
                <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                  {eyebrow}
                </span>
              )}
              {badge && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-primaryColor ring-1 ring-primaryColor/15">
                  {badge}
                </span>
              )}
            </div>
          )}
          <h4
            className={cn(
              "text-sm font-semibold leading-snug",
              CALLOUT_TONES[tone].title
            )}
          >
            {title}
          </h4>
          {description && (
            <p
              className={cn(
                "mt-1 text-xs leading-relaxed sm:text-sm",
                CALLOUT_TONES[tone].body
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Numbered vertical timeline for step-by-step processes. */
export function PolicySteps({
  steps,
  className,
}: {
  steps: { title: string; description: ReactNode }[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <li key={step.title} className="relative pl-11">
          {index < steps.length - 1 && (
            <span
              aria-hidden
              className="absolute top-9 bottom-[-1rem] left-[15px] w-px bg-gray-200"
            />
          )}
          <span className="absolute left-0 top-0 grid size-8 place-items-center rounded-full bg-primaryColor/[0.07] text-xs font-bold text-primaryColor ring-1 ring-primaryColor/15 tabular-nums">
            {index + 1}
          </span>
          <h4 className="text-sm font-semibold text-gray-900 sm:text-[15px]">
            {step.title}
          </h4>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
            {step.description}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Compact pill for hero / section metadata. */
export function PolicyChip({
  icon: Icon,
  className,
  children,
}: {
  icon?: PolicyIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-xs",
        className
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0 text-primaryColor" />}
      <span className="min-w-0">{children}</span>
    </span>
  );
}

/** Cross-links to the other policy documents. */
export function PolicyRelatedLinks({
  items,
  className,
}: {
  items: { href: string; label: string; description?: string }[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6",
        className
      )}
      aria-labelledby="related-policies-heading"
    >
      <h2
        id="related-policies-heading"
        className="text-sm font-semibold tracking-wide text-gray-900 uppercase sm:text-base"
      >
        Related policies
      </h2>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 transition-colors hover:border-primaryColor/30 hover:bg-primaryColor/[0.04]"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900 group-hover:text-primaryColor">
                {item.label}
              </span>
              {item.description && (
                <span className="mt-0.5 block text-xs text-gray-500">
                  {item.description}
                </span>
              )}
            </span>
            <ArrowRight className="size-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primaryColor" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Contact block closing every policy document. */
export function PolicyContactCard({
  title,
  description,
  footnote,
  settings,
  className,
}: {
  title: string;
  description: ReactNode;
  footnote?: ReactNode;
  settings?: BusinessSettings | null;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-primaryColor/15 bg-linear-to-br from-primaryColor/[0.05] via-white to-white p-4 shadow-sm sm:p-6",
        className
      )}
      aria-labelledby="policy-contact-heading"
    >
      <div className="flex flex-col gap-1 text-center">
        <h2
          id="policy-contact-heading"
          className="font-castor text-xl text-primaryColor sm:text-2xl"
        >
          {title}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-600">
          {description}
        </p>
        <PolicyContactLinks settings={settings} className="mt-2" />
        {footnote && (
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-gray-500">
            {footnote}
          </p>
        )}
      </div>
    </section>
  );
}
