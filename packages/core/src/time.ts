/** Time windows used by the filters. Everything in UTC to avoid time zone ambiguity. */

export interface Range {
  from: Date;
  to: Date;
}

export function last24h(now = new Date()): Range {
  return { from: new Date(now.getTime() - 24 * 3600_000), to: now };
}

/** A month (1-12) of a year; without a month, the whole year. */
export function monthRange(year: number, month?: number): Range {
  if (month === undefined) {
    return { from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year + 1, 0, 1)) };
  }
  return { from: new Date(Date.UTC(year, month - 1, 1)), to: new Date(Date.UTC(year, month, 1)) };
}

export function currentMonthRange(now = new Date()): Range {
  return monthRange(now.getUTCFullYear(), now.getUTCMonth() + 1);
}
