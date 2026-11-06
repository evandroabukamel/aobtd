import { describe, expect, it } from 'vitest';
import { currentYearMonth, isFutureMonth } from '../src/domain/calendar';
import { Filters, isSameFilter } from '../src/domain/filter';
import { describeFilter, formatCount } from '../src/presentation/shared/format';

describe('filtros', () => {
  it('compara filtros pelo recorte de tempo', () => {
    expect(isSameFilter(Filters.last24h(), Filters.last24h())).toBe(true);
    expect(isSameFilter(Filters.month(2026, 3), Filters.month(2026, 3))).toBe(true);
    expect(isSameFilter(Filters.month(2026, 3), Filters.month(2026, 4))).toBe(false);
    expect(isSameFilter(Filters.year(2026), Filters.month(2026, 3))).toBe(false);
    expect(isSameFilter(Filters.year(2026), Filters.year(2025))).toBe(false);
    expect(isSameFilter(Filters.last24h(), Filters.year(2026))).toBe(false);
  });

  it('descreve o filtro em português', () => {
    expect(describeFilter(Filters.last24h())).toBe('Últimas 24 horas');
    expect(describeFilter(Filters.month(2026, 3))).toBe('março de 2026');
    expect(describeFilter(Filters.year(2025))).toBe('Ano de 2025');
  });

  it('formata contagens', () => {
    expect(formatCount(undefined)).toBe('–');
    expect(formatCount(1234)).toBe('1.234');
  });
});

describe('calendário (UTC)', () => {
  const now = new Date('2026-11-01T01:00:00Z');

  it('usa o mês corrente em UTC', () => {
    expect(currentYearMonth(now)).toEqual({ year: 2026, month: 11 });
  });

  it('marca como futuros só os meses seguintes do ano corrente', () => {
    expect(isFutureMonth(2026, 12, now)).toBe(true);
    expect(isFutureMonth(2026, 11, now)).toBe(false);
    expect(isFutureMonth(2025, 12, now)).toBe(false);
  });
});
