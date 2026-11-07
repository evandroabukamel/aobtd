import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Filter } from '../domain/filter';
import { createFormatters, type Formatters } from './format';
import { DEFAULT_LOCALE, findLocale, LOCALES, matchLocale, type LocaleTag } from './locales';
import type { Messages } from './messages';

const STORAGE_KEY = 'aobtd.locale';

export interface I18n {
  locale: LocaleTag;
  setLocale: (tag: LocaleTag) => void;
  t: Messages;
  fmt: Formatters;
  describeFilter: (f: Filter) => string;
}

const I18nContext = createContext<I18n | null>(null);

/** Saved choice first, then the browser languages. Storage can throw in private mode. */
function initialLocale(): LocaleTag {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && findLocale(saved)) return saved as LocaleTag;
  } catch {
    /* storage unavailable: fall back to the browser languages */
  }
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  return matchLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: LocaleTag }) {
  const [locale, setLocaleState] = useState<LocaleTag>(() => initial ?? initialLocale());

  const setLocale = useCallback((tag: LocaleTag) => {
    setLocaleState(tag);
    try {
      localStorage.setItem(STORAGE_KEY, tag);
    } catch {
      /* the choice just won't survive a reload */
    }
  }, []);

  // One object per locale change, so components that read the context re-render only then.
  const value = useMemo<I18n>(() => {
    const entry = LOCALES.find((l) => l.tag === locale)!;
    const t = entry.messages;
    const fmt = createFormatters(locale);
    return { locale, setLocale, t, fmt, describeFilter: filterDescriber(t, fmt, locale) };
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = value.t.title;
  }, [locale, value.t.title]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Map caption for a filter: "Last 24 hours", "November 2026", "Year 2025". */
export const filterDescriber = (t: Messages, fmt: Formatters, tag: string) => (f: Filter) => {
  if (f.kind === '24h') return capitalize(t.last24h, tag);
  return f.month ? capitalize(fmt.monthYear(f.year, f.month), tag) : t.yearOf(f.year);
};

export function capitalize(s: string, tag: string): string {
  return s.charAt(0).toLocaleUpperCase(tag) + s.slice(1);
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
