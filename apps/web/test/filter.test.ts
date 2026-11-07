import { describe, expect, it } from 'vitest';
import { currentYearMonth, isFutureMonth } from '../src/domain/calendar';
import { Filters, isSameFilter } from '../src/domain/filter';
import { createFormatters } from '../src/i18n/format';
import { filterDescriber } from '../src/i18n/I18nContext';
import { LOCALES, matchLocale } from '../src/i18n/locales';
import { en } from '../src/i18n/locales/en';
import { ptBR } from '../src/i18n/locales/pt-BR';

describe('filters', () => {
  it('compares filters by time range', () => {
    expect(isSameFilter(Filters.last24h(), Filters.last24h())).toBe(true);
    expect(isSameFilter(Filters.month(2026, 3), Filters.month(2026, 3))).toBe(true);
    expect(isSameFilter(Filters.month(2026, 3), Filters.month(2026, 4))).toBe(false);
    expect(isSameFilter(Filters.year(2026), Filters.month(2026, 3))).toBe(false);
    expect(isSameFilter(Filters.year(2026), Filters.year(2025))).toBe(false);
    expect(isSameFilter(Filters.last24h(), Filters.year(2026))).toBe(false);
  });
});

describe('i18n', () => {
  it('describes the filter in the chosen language', () => {
    const enDescribe = filterDescriber(en, createFormatters('en'), 'en');
    expect(enDescribe(Filters.last24h())).toBe('Last 24 hours');
    expect(enDescribe(Filters.month(2026, 3))).toBe('March 2026');
    expect(enDescribe(Filters.year(2025))).toBe('Year 2025');

    const ptDescribe = filterDescriber(ptBR, createFormatters('pt-BR'), 'pt-BR');
    expect(ptDescribe(Filters.last24h())).toBe('Últimas 24 horas');
    expect(ptDescribe(Filters.month(2026, 3))).toBe('Março de 2026');
    expect(ptDescribe(Filters.year(2025))).toBe('Ano de 2025');
  });

  it('formats counts and month names with Intl', () => {
    const pt = createFormatters('pt-BR');
    expect(pt.count(undefined)).toBe('–');
    expect(pt.count(1234)).toBe('1.234');
    expect(createFormatters('en').count(1234)).toBe('1,234');
    expect(pt.monthsLong[2]).toBe('março');
    expect(createFormatters('de').monthsLong[2]).toBe('März');
    expect(pt.monthsShort).toHaveLength(12);
  });

  it('picks the best supported locale for the browser languages', () => {
    expect(matchLocale(['pt-PT', 'en'])).toBe('pt-PT');
    expect(matchLocale(['pt'])).toBe('pt-BR');
    expect(matchLocale(['zh-TW'])).toBe('zh-CN');
    expect(matchLocale(['uk-UA'])).toBe('uk');
    expect(matchLocale(['ko', 'fr-CA'])).toBe('fr');
    expect(matchLocale(['ko'])).toBe('en');
  });

  it('offers the ten requested languages, each with a flag', () => {
    expect(LOCALES.map((l) => l.tag)).toEqual(['pt-BR', 'pt-PT', 'en', 'es', 'de', 'fr', 'zh-CN', 'ja', 'ru', 'uk']);
    for (const l of LOCALES) expect(l.flag).toBeTruthy();
  });
});

describe('calendar (UTC)', () => {
  const now = new Date('2026-11-01T01:00:00Z');

  it('uses the current month in UTC', () => {
    expect(currentYearMonth(now)).toEqual({ year: 2026, month: 11 });
  });

  it('marks as future only the following months of the current year', () => {
    expect(isFutureMonth(2026, 12, now)).toBe(true);
    expect(isFutureMonth(2026, 11, now)).toBe(false);
    expect(isFutureMonth(2025, 12, now)).toBe(false);
  });
});
