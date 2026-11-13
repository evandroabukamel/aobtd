import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApi, type AccidentReader } from '../src/app.js';
import { createSite } from '../src/site.js';

const reader: AccidentReader = {
  markers: async () => ({ from: '', to: '', total: 0, markers: [] }),
  stats: async () => Promise.reject(new Error('password authentication failed')),
  accident: async () => null,
  status: async () => ({ sources: 13, lastScanAt: null }),
  health: async () => {},
};

/** A built site, as `vite build` leaves it. */
function distDir() {
  const dir = mkdtempSync(join(tmpdir(), 'aobtd-dist-'));
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>aobtd</title>');
  writeFileSync(join(dir, 'assets', 'index-abc123.js'), 'console.log(1)');
  return dir;
}

describe('Node site (API + built web app)', () => {
  const site = createSite(createApi(reader), distDir());

  it('serves the API', async () => {
    const res = await site.request('/api/status');
    expect(await res.json()).toEqual({ sources: 13, lastScanAt: null });
  });

  it('keeps API errors as JSON: 404 for unknown paths, 500 without details', async () => {
    const missing = await site.request('/api/nope');
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'Not found' });
    const failing = await site.request('/api/stats');
    expect(failing.status).toBe(500);
    expect(await failing.text()).not.toContain('password');
  });

  it('serves hashed assets with a year-long cache', async () => {
    const res = await site.request('/assets/index-abc123.js');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('console.log(1)');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });

  it('falls back to index.html for app routes, revalidated on every visit', async () => {
    for (const path of ['/', '/some/client/route']) {
      const res = await site.request(path);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain('<title>aobtd</title>');
      expect(res.headers.get('cache-control')).toBe('no-cache');
    }
  });

  it('serves only the API when there is no built site', async () => {
    const apiOnly = createSite(createApi(reader), undefined);
    expect((await apiOnly.request('/api/status')).status).toBe(200);
    expect((await apiOnly.request('/')).status).toBe(404);
  });
});
