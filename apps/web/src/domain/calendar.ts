/** Ano e mês (1 a 12) correntes em UTC, o fuso usado pela coleta e pela API. */
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
