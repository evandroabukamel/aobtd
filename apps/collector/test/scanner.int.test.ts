import { readFileSync } from 'node:fs';
import { createPool, migrate, type Db } from '@aobtd/core';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Geocoder } from '../src/geocode.js';
import { loadSources, runDueScans, scanSource } from '../src/scanner.js';

const url = process.env.TEST_DATABASE_URL;
const rss = readFileSync(new URL('./fixtures/feed.rss.xml', import.meta.url), 'utf8');

const places: Record<string, { lat: number; lng: number; country: string }> = {
  'austin, texas': { lat: 30.2672, lng: -97.7431, country: 'US' },
  austin: { lat: 30.27, lng: -97.74, country: 'US' },
  ubatuba: { lat: -23.4336, lng: -45.0838, country: 'BR' },
};
const geocoder: Geocoder = { geocode: async (q) => places[q.toLowerCase()] ?? null };
const fetchFn = (async () => new Response(rss, { headers: { etag: '"v1"' } })) as typeof fetch;
const now = () => new Date('2026-11-05T15:00:00Z');

describe.skipIf(!url)('coleta com PostgreSQL', () => {
  let db: Db;

  beforeAll(async () => {
    db = createPool(url);
    await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    await migrate(db, () => {});
  });
  beforeEach(async () => {
    await db.query('TRUNCATE accidents, articles, scan_runs, geocode_cache RESTART IDENTITY CASCADE');
    await db.query('UPDATE sources SET last_scan_at = NULL, etag = NULL, last_modified = NULL');
  });
  afterAll(() => db?.end());

  it('filtra, geocodifica e agrupa notícias do mesmo acidente', async () => {
    const [bbc] = (await loadSources(db)).filter((s) => s.slug === 'bbc');
    const summary = await scanSource({ db, geocoder, fetchFn, now }, bbc!);
    // a1 + a2 (Austin, mesmo acidente), b1 (Ubatuba). Drone, eleição e notícia antiga ficam de fora.
    expect(summary).toMatchObject({ status: 'ok', seen: 5, relevant: 3, newArticles: 3, newAccidents: 2 });

    const { rows } = await db.query(
      `SELECT a.location_name, a.fatalities, a.aircraft, count(r.id)::int AS n
         FROM accidents a JOIN articles r ON r.accident_id = a.id GROUP BY a.id ORDER BY a.id`,
    );
    expect(rows).toEqual([
      { location_name: 'Austin, Texas', fatalities: 2, aircraft: 'Cessna 172', n: 2 },
      { location_name: 'Ubatuba', fatalities: null, aircraft: null, n: 1 },
    ]);

    const again = await scanSource({ db, geocoder, fetchFn, now }, bbc!);
    expect(again.newArticles).toBe(0);
  });

  it('varre cada fonte só uma vez por período', async () => {
    const deps = { db, geocoder, fetchFn, now };
    const first = await runDueScans(deps);
    // Às 15h UTC as janelas 00h, 06h e 12h já abriram; a das 18h foi aberta ontem e também está pendente.
    expect(first).toHaveLength((await loadSources(db)).length);
    expect(await runDueScans(deps)).toHaveLength(0);

    const tomorrow = { ...deps, now: () => new Date('2026-11-06T06:30:00Z') };
    const second = await runDueScans(tomorrow);
    // Às 06h30 do dia seguinte: janelas 00h e 06h de hoje e a das 18h de ontem (varrida pela última vez às 15h).
    // A janela das 12h (ap, aaib, tsb) ainda está no período em que já foi varrida.
    const slugs = new Set(second.map((s) => s.source));
    expect(slugs.has('ap') || slugs.has('aaib') || slugs.has('tsb')).toBe(false);
    expect(slugs.size).toBe((await loadSources(db)).length - 3);
  });
});
