export interface DhakaNow {
  /** Day of week in Asia/Dhaka: 0 = Sunday ... 6 = Saturday */
  day: number;
  /** Time of day in Asia/Dhaka as "HH:mm" (24h) */
  time: string;
}

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Current day-of-week and clock time in the Asia/Dhaka timezone — used by
 * free-delivery campaign day/time conditions so schedules follow local time
 * regardless of the server's timezone. */
export function getDhakaNow(date: Date = new Date()): DhakaNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const hour = get('hour') === '24' ? '00' : get('hour');
  return {
    day: WEEKDAYS[get('weekday')] ?? 0,
    time: `${hour}:${get('minute')}`,
  };
}
