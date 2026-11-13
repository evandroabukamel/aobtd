import { describe, expect, it, vi } from 'vitest';
import type { AccidentReader } from '../src/app.js';
import { createApi } from '../src/app.js';

const NOW = new Date('2026-03-15T12:00:00Z');

/** In-memory reader: records the windows the API asks for. */
function fakeReader(overrides: Partial<AccidentReader> = {}): AccidentReader {
  return {
    markers: vi.fn(async (range) => ({ from: range.from.toISOString(), to: range.to.toISOString(), total: 0, markers: [] })),
    stats: vi.fn(async (year) => ({ year, last24h: 1, currentMonth: 2, yearTotal: 3, months: Array(12).fill(0), years: [year] })),
    accident: vi.fn(async (id) =>
      id === 7
        ? { id, occurredAt: '2026-03-02T10:00:00.000Z', location: 'Madagascar', country: 'MG', aircraft: null, fatalities: 3, articles: [] }
        : null,
    ),
    status: vi.fn(async () => ({ sources: 13, lastScanAt: null })),
    health: vi.fn(async () => {}),
    ...overrides,
  };
}

const setup = (reader = fakeReader()) => ({ reader, api: createApi(reader, () => NOW) });

describe('accidents API', () => {
  it('serves the last 24h markers with a short cache', async () => {
    const { api, reader } = setup();
    const res = await api.request('/api/accidents?period=24h');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
    expect(reader.markers).toHaveBeenCalledWith({ from: new Date('2026-03-14T12:00:00Z'), to: NOW });
  });

  it('defaults a month request to the current month, and takes a year or a month of it', async () => {
    const { api, reader } = setup();
    await api.request('/api/accidents?period=month');
    expect(reader.markers).toHaveBeenLastCalledWith({ from: new Date('2026-03-01T00:00:00Z'), to: new Date('2026-04-01T00:00:00Z') });
    await api.request('/api/accidents?period=month&year=2025');
    expect(reader.markers).toHaveBeenLastCalledWith({ from: new Date('2025-01-01T00:00:00Z'), to: new Date('2026-01-01T00:00:00Z') });
    const res = await api.request('/api/accidents?period=month&year=2025&month=6');
    expect(reader.markers).toHaveBeenLastCalledWith({ from: new Date('2025-06-01T00:00:00Z'), to: new Date('2025-07-01T00:00:00Z') });
    expect(res.headers.get('cache-control')).toBe('public, max-age=300, stale-while-revalidate=600');
  });

  it.each([
    '/api/accidents',
    '/api/accidents?period=week',
    '/api/accidents?period=month&year=abc',
    '/api/accidents?period=month&year=2025.5',
    '/api/accidents?period=month&year=1800',
    '/api/accidents?period=month&month=13',
    '/api/accidents?period=24h&extra=1',
    '/api/stats?year=x',
    '/api/stats?foo=1',
    '/api/accidents/0',
    '/api/accidents/abc',
  ])('rejects bad parameters: %s', async (url) => {
    const { api, reader } = setup();
    const res = await api.request(url);
    expect(res.status).toBe(400);
    expect(reader.markers).not.toHaveBeenCalled();
    expect(reader.accident).not.toHaveBeenCalled();
  });

  it('serves the counters of the asked year, the current one by default', async () => {
    const { api, reader } = setup();
    expect(await (await api.request('/api/stats?year=2025')).json()).toMatchObject({ year: 2025, yearTotal: 3 });
    const res = await api.request('/api/stats');
    expect(reader.stats).toHaveBeenLastCalledWith(2026);
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
  });

  it('serves an accident, or 404 when it does not exist', async () => {
    const { api } = setup();
    const res = await api.request('/api/accidents/7');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 7, location: 'Madagascar' });
    expect(res.headers.get('cache-control')).toBe('public, max-age=300, stale-while-revalidate=600');
    expect((await api.request('/api/accidents/999')).status).toBe(404);
  });

  it('answers 304 when the client already has the same response', async () => {
    const { api } = setup();
    const first = await api.request('/api/accidents/7');
    const etag = first.headers.get('etag')!;
    expect(etag).toBeTruthy();
    const second = await api.request('/api/accidents/7', { headers: { 'if-none-match': etag } });
    expect(second.status).toBe(304);
  });

  it('serves the collection status and a health check', async () => {
    const { api, reader } = setup();
    expect(await (await api.request('/api/status')).json()).toEqual({ sources: 13, lastScanAt: null });
    const health = await api.request('/api/health');
    expect(await health.json()).toEqual({ ok: true });
    expect(reader.health).toHaveBeenCalled();
  });

  it('answers unknown API paths with a JSON 404', async () => {
    const { api } = setup();
    const res = await api.request('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });

  it('reports a failing database as a 500 without leaking details', async () => {
    const { api } = setup(fakeReader({ status: async () => Promise.reject(new Error('password authentication failed')) }));
    const res = await api.request('/api/status');
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain('password');
  });
});
