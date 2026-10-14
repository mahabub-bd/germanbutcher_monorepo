/** Date + time-input helpers shared by the campaign/coupon admin forms. */

/** Combine a date-picker day with an HH:mm time input; without a valid
 * time it falls back to start-of-day (false) or end-of-day (true). A
 * date-only end date means "through the end of that day" — a bare midnight
 * would otherwise end the validity at the day's start. */
export const applyTime = (
  date: Date,
  time: string,
  endOfDay: boolean
): Date => {
  const result = new Date(date);
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (match) {
    result.setHours(Number(match[1]), Number(match[2]), 0, 0);
  } else {
    result.setHours(
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    );
  }
  return result;
};

/** Local HH:mm for pre-filling a time input from a stored date. */
export const toTimeInputValue = (date: Date): string =>
  `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
