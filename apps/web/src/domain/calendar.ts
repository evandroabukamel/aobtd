/** Current year and month (1 to 12) in UTC, the time zone used by the collector and the API. */
export interface YearMonth {
  year: number;
  month: number;
}

export const currentYearMonth = (now: Date): YearMonth => ({
  year: now.getUTCFullYear(),
  month: now.getUTCMonth() + 1,
});

export function isFutureMonth(year: number, month: number, now: Date): boolean {
  const cur = currentYearMonth(now);
  return year === cur.year && month > cur.month;
}
