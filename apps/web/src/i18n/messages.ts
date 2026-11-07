import type { SourceKind } from '../domain/accident';

/**
 * Every user-facing string of the site. Each locale file must implement this interface,
 * so a missing translation is a type error. Phrases that carry numbers are written as
 * "label: value" to sidestep plural rules, which differ a lot between languages.
 */
export interface Messages {
  title: string;
  subtitle: string;
  language: string;
  last24h: string;
  /** Counter label for the current month, e.g. "in November". */
  inMonth: (month: string) => string;
  yearOf: (year: number) => string;
  year: string;
  wholeYear: string;
  counters: string;
  accidentsPerMonth: (year: number) => string;
  monthCount: (month: string, count: number) => string;
  onMap: (count: number) => string;
  loading: string;
  loadingMap: string;
  loadError: string;
  accident: string;
  loadingSources: string;
  sourcesError: string;
  date: string;
  aircraft: string;
  fatalities: string;
  notReported: string;
  sources: (count: number) => string;
  close: string;
  fatalitiesTooltip: (count: number) => string;
  fatalitiesUnknown: string;
  kind: Record<SourceKind, string>;
}
