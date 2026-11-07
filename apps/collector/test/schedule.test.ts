import { describe, expect, it } from 'vitest';
import { isDue, nextRun, periodStart } from '../src/schedule.js';

const at = (iso: string) => new Date(iso);

describe('staggered daily schedule', () => {
  it('each window starts every 6h from 00h UTC', () => {
    const now = at('2026-11-05T13:00:00Z');
    expect(periodStart(0, now).toISOString()).toBe('2026-11-05T00:00:00.000Z');
    expect(periodStart(1, now).toISOString()).toBe('2026-11-05T06:00:00.000Z');
    expect(periodStart(2, now).toISOString()).toBe('2026-11-05T12:00:00.000Z');
    // The 18h window hasn't come yet today: the current period started yesterday.
    expect(periodStart(3, now).toISOString()).toBe('2026-11-04T18:00:00.000Z');
  });

  it('scans a source never scanned', () => {
    expect(isDue(2, null, at('2026-11-05T01:00:00Z'))).toBe(true);
  });

  it('does not scan again in the same 24h period', () => {
    const scanned = at('2026-11-05T12:03:00Z');
    expect(isDue(2, scanned, at('2026-11-05T23:59:00Z'))).toBe(false);
    expect(isDue(2, scanned, at('2026-11-06T11:59:00Z'))).toBe(false);
    expect(isDue(2, scanned, at('2026-11-06T12:00:00Z'))).toBe(true);
  });

  it('catches up a missed window when the process comes back', () => {
    expect(isDue(1, at('2026-11-03T06:01:00Z'), at('2026-11-05T09:00:00Z'))).toBe(true);
  });

  it('computes the next run', () => {
    expect(nextRun(3, at('2026-11-05T18:00:10Z'), at('2026-11-05T20:00:00Z')).toISOString()).toBe(
      '2026-11-06T18:00:00.000Z',
    );
  });
});
