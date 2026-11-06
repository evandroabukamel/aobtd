/** Recorte de tempo exibido no mapa: últimas 24h, um mês ou um ano inteiro. */
export type Filter = { kind: '24h' } | { kind: 'period'; year: number; month?: number };

export const Filters = {
  last24h: (): Filter => ({ kind: '24h' }),
  year: (year: number): Filter => ({ kind: 'period', year }),
  month: (year: number, month: number): Filter => ({ kind: 'period', year, month }),
} as const;

export function isSameFilter(a: Filter, b: Filter): boolean {
  if (a.kind === '24h' || b.kind === '24h') return a.kind === b.kind;
  return a.year === b.year && a.month === b.month;
}
