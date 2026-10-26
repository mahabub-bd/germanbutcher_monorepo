"use client";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number | string;
    name?: string;
    color?: string;
    fill?: string;
  }>;
  label?: string | number;
  /** Human label for the value row, e.g. "Requests". */
  valueLabel?: string;
  /** Appended to the formatted value, e.g. "ms". */
  valueSuffix?: string;
}

/** Shared, theme-aware tooltip for every analytics chart. */
export function ChartTooltip({
  active,
  payload,
  label,
  valueLabel = "Value",
  valueSuffix = "",
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const value = Number(entry?.value ?? 0);
  const color = entry?.color ?? entry?.fill;
  const heading = label ?? entry?.name;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      {heading !== undefined && (
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {heading}
        </p>
      )}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {color && (
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          {valueLabel}
        </span>
        <span className="font-semibold tabular-nums">
          {value.toLocaleString()}
          {valueSuffix}
        </span>
      </div>
    </div>
  );
}
