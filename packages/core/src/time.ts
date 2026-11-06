/** Janelas de tempo usadas nos filtros. Tudo em UTC para evitar ambiguidade de fuso. */

export interface Range {
  from: Date;
  to: Date;
}

export function last24h(now = new Date()): Range {
  return { from: new Date(now.getTime() - 24 * 3600_000), to: now };
}

/** Mês (1-12) de um ano; sem mês, o ano inteiro. */
export function monthRange(year: number, month?: number): Range {
  if (month === undefined) {
    return { from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year + 1, 0, 1)) };
  }
  return { from: new Date(Date.UTC(year, month - 1, 1)), to: new Date(Date.UTC(year, month, 1)) };
}

export function currentMonthRange(now = new Date()): Range {
  return monthRange(now.getUTCFullYear(), now.getUTCMonth() + 1);
}
