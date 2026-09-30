/**
 * Shared report date-range helpers: resolve a preset (today, this_month, …)
 * or explicit YYYY-MM-DD bounds into concrete Date limits for report queries.
 */

export const REPORT_PRESETS = [
  'today',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'last_3_months',
  'last_6_months',
  'last_year',
  'this_year',
] as const;

export function getDateRangeFromPreset(
  preset: string,
): { from: Date; to: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  switch (preset) {
    case 'today':
      return { from: startOfDay, to: endOfDay };

    case 'this_week': {
      const dayOfWeek = today.getDay();
      const from = new Date(today);
      from.setDate(today.getDate() - dayOfWeek);
      from.setHours(0, 0, 0, 0);
      return { from, to: endOfDay };
    }

    case 'last_week': {
      const dayOfWeek = today.getDay();
      const from = new Date(today);
      from.setDate(today.getDate() - dayOfWeek - 7);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }

    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
      return { from, to: endOfDay };
    }

    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }

    case 'last_3_months': {
      const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      from.setHours(0, 0, 0, 0);
      return { from, to: endOfDay };
    }

    case 'last_6_months': {
      const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      from.setHours(0, 0, 0, 0);
      return { from, to: endOfDay };
    }

    case 'last_year': {
      const from = new Date(now.getFullYear() - 1, 0, 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now.getFullYear() - 1, 11, 31);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }

    case 'this_year': {
      const from = new Date(now.getFullYear(), 0, 1);
      from.setHours(0, 0, 0, 0);
      return { from, to: endOfDay };
    }

    default:
      return null;
  }
}

export function parseReportDate(
  dateStr?: string,
  endOfDay = false,
): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: "${dateStr}". Use YYYY-MM-DD.`);
  }
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

/** Resolves preset-or-explicit bounds, throwing on an unknown preset. */
export function resolveReportRange(
  fromDate?: string,
  toDate?: string,
  preset?: string,
): { from?: Date; to?: Date } {
  if (preset) {
    const range = getDateRangeFromPreset(preset);
    if (!range) {
      throw new Error(
        `Invalid date range preset: "${preset}". Valid values are: ${REPORT_PRESETS.join(', ')}.`,
      );
    }
    return range;
  }
  return {
    from: parseReportDate(fromDate),
    to: parseReportDate(toDate, true),
  };
}
