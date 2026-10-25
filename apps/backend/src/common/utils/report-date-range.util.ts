/**
 * Shared report date-range helpers: resolve a preset (today, this_month, …)
 * or explicit YYYY-MM-DD bounds into concrete Date limits for report queries.
 *
 * All day boundaries follow Dhaka time (UTC+6, no DST) so reports match the
 * business day in Bangladesh regardless of the server's timezone. Bounds are
 * returned as UTC instants, matching how `createdAt` timestamps are stored.
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

/** Dhaka stays at UTC+6 year-round (no DST). */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Current Dhaka wall-clock, shifted into a Date's UTC fields (read via getUTC*). */
function dhakaNow(): Date {
  return new Date(Date.now() + DHAKA_OFFSET_MS);
}

/** UTC instant of Dhaka-local midnight for the given Dhaka Y/M/D. */
function dhakaMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - DHAKA_OFFSET_MS);
}

/** End of the Dhaka day whose midnight instant is given (each Dhaka day is 24h). */
function endOfDhakaDay(dayStartUtc: Date): Date {
  return new Date(dayStartUtc.getTime() + DAY_MS - 1);
}

export function getDateRangeFromPreset(
  preset: string,
): { from: Date; to: Date } | null {
  const now = dhakaNow();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const dayOfWeek = now.getUTCDay();

  const endOfToday = () => endOfDhakaDay(dhakaMidnight(y, m, d));

  switch (preset) {
    case 'today': {
      const from = dhakaMidnight(y, m, d);
      return { from, to: endOfDhakaDay(from) };
    }

    case 'this_week': {
      const from = dhakaMidnight(y, m, d - dayOfWeek);
      return { from, to: endOfToday() };
    }

    case 'last_week': {
      const from = dhakaMidnight(y, m, d - dayOfWeek - 7);
      return { from, to: endOfDhakaDay(new Date(from.getTime() + 6 * DAY_MS)) };
    }

    case 'this_month': {
      const from = dhakaMidnight(y, m, 1);
      return { from, to: endOfToday() };
    }

    case 'last_month': {
      const from = dhakaMidnight(y, m - 1, 1);
      const to = endOfDhakaDay(dhakaMidnight(y, m, 0));
      return { from, to };
    }

    case 'last_3_months': {
      const from = dhakaMidnight(y, m - 3, 1);
      return { from, to: endOfToday() };
    }

    case 'last_6_months': {
      const from = dhakaMidnight(y, m - 6, 1);
      return { from, to: endOfToday() };
    }

    case 'last_year': {
      const from = dhakaMidnight(y - 1, 0, 1);
      const to = endOfDhakaDay(dhakaMidnight(y - 1, 11, 31));
      return { from, to };
    }

    case 'this_year': {
      const from = dhakaMidnight(y, 0, 1);
      return { from, to: endOfToday() };
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
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) {
    throw new Error(`Invalid date format: "${dateStr}". Use YYYY-MM-DD.`);
  }
  const midnight = dhakaMidnight(+match[1], +match[2] - 1, +match[3]);
  return endOfDay ? endOfDhakaDay(midnight) : midnight;
}

/** Dhaka calendar date (YYYY-MM-DD) of a UTC instant, for echoing bounds
 * back to clients — toISOString() alone would show the previous day. */
export function formatDhakaDate(date: Date): string {
  return new Date(date.getTime() + DHAKA_OFFSET_MS)
    .toISOString()
    .split('T')[0];
}

/** Start/end bounds for the "last_month / this_month / last_3_months /
 * last_6_months / last_year / this_year" quick filters used by the
 * bestseller and top-customer widgets, in Dhaka time. Null = all-time. */
export function getTimeFilterRange(
  timeFilter: string,
): { start: Date; end?: Date } | null {
  const now = dhakaNow();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  switch (timeFilter) {
    case 'last_month':
      return { start: dhakaMidnight(y, m - 1, 1), end: dhakaMidnight(y, m, 1) };
    case 'this_month':
      return { start: dhakaMidnight(y, m, 1) };
    case 'last_3_months':
      return { start: dhakaMidnight(y, m - 3, d) };
    case 'last_6_months':
      return { start: dhakaMidnight(y, m - 6, d) };
    case 'last_year':
      return { start: dhakaMidnight(y - 1, m, d) };
    case 'this_year':
      return { start: dhakaMidnight(y, 0, 1) };
    case 'all_time':
    default:
      return null;
  }
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
