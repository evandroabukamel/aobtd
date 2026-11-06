import { describe, expect, it } from 'vitest';
import { isDue, nextRun, periodStart } from '../src/schedule.js';

const at = (iso: string) => new Date(iso);

describe('agenda diária escalonada', () => {
  it('cada janela começa a cada 6h a partir de 00h UTC', () => {
    const now = at('2026-11-05T13:00:00Z');
    expect(periodStart(0, now).toISOString()).toBe('2026-11-05T00:00:00.000Z');
    expect(periodStart(1, now).toISOString()).toBe('2026-11-05T06:00:00.000Z');
    expect(periodStart(2, now).toISOString()).toBe('2026-11-05T12:00:00.000Z');
    // Janela das 18h ainda não chegou hoje: o período vigente começou ontem.
    expect(periodStart(3, now).toISOString()).toBe('2026-11-04T18:00:00.000Z');
  });

  it('varre uma fonte nunca varrida', () => {
    expect(isDue(2, null, at('2026-11-05T01:00:00Z'))).toBe(true);
  });

  it('não varre de novo no mesmo período de 24h', () => {
    const scanned = at('2026-11-05T12:03:00Z');
    expect(isDue(2, scanned, at('2026-11-05T23:59:00Z'))).toBe(false);
    expect(isDue(2, scanned, at('2026-11-06T11:59:00Z'))).toBe(false);
    expect(isDue(2, scanned, at('2026-11-06T12:00:00Z'))).toBe(true);
  });

  it('recupera janela perdida quando o processo volta', () => {
    expect(isDue(1, at('2026-11-03T06:01:00Z'), at('2026-11-05T09:00:00Z'))).toBe(true);
  });

  it('calcula a próxima execução', () => {
    expect(nextRun(3, at('2026-11-05T18:00:10Z'), at('2026-11-05T20:00:00Z')).toISOString()).toBe(
      '2026-11-06T18:00:00.000Z',
    );
  });
});
