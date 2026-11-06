import { describe, expect, it } from 'vitest';
import { rangedUrl, windows } from '../src/backfill.js';

describe('backfill', () => {
  it('cobre o ano em janelas até amanhã', () => {
    const w = windows(2026, 10, new Date('2026-01-25T12:00:00Z'));
    expect(w.map(([a, b]) => [a.toISOString().slice(0, 10), b.toISOString().slice(0, 10)])).toEqual([
      ['2026-01-01', '2026-01-11'],
      ['2026-01-11', '2026-01-21'],
      ['2026-01-21', '2026-01-26'],
    ]);
  });

  it('troca when:Nd por after/before na busca do Google News', () => {
    const url = 'https://news.google.com/rss/search?q=crash+NTSB+when:2d&hl=en-US';
    expect(rangedUrl(url, new Date('2026-03-01'), new Date('2026-03-11'))).toBe(
      'https://news.google.com/rss/search?q=crash+NTSB+after:2026-03-01+before:2026-03-11&hl=en-US',
    );
  });
});
