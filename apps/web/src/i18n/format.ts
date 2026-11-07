/**
 * Locale-aware formatters built on Intl, so month names, dates and numbers come out
 * right in every language without hand-written lists. Times are always UTC, the
 * time zone used by the collector and the API.
 */
export interface Formatters {
  date: (value: string | number) => string;
  count: (n: number | undefined) => string;
  /** Short month names, January first. */
  monthsShort: string[];
  /** Long month names (standalone form), January first. */
  monthsLong: string[];
  monthYear: (year: number, month: number) => string;
}

const monthNames = (tag: string, month: 'short' | 'long') => {
  const fmt = new Intl.DateTimeFormat(tag, { month, timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, i) => fmt.format(Date.UTC(2000, i, 15)));
};

export function createFormatters(tag: string): Formatters {
  const dateFmt = new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeZone: 'UTC' });
  const monthYearFmt = new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const numberFmt = new Intl.NumberFormat(tag);
  return {
    // Accepts ISO 8601 or epoch seconds (the marker format).
    date: (value) => dateFmt.format(typeof value === 'number' ? value * 1000 : new Date(value)),
    // '–' while the number has not loaded yet.
    count: (n) => (n === undefined ? '–' : numberFmt.format(n)),
    monthsShort: monthNames(tag, 'short'),
    monthsLong: monthNames(tag, 'long'),
    monthYear: (year, month) => monthYearFmt.format(Date.UTC(year, month - 1, 15)),
  };
}
