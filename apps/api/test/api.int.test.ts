import { createPool, migrate, type Db } from '@aobtd/core';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('API', () => {
  let db: Db;
  let app: FastifyInstance;
  const now = new Date();
  const y = now.getUTCFullYear();

  beforeAll(async () => {
    db = createPool(url);
    await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    await migrate(db, () => {});
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);
    await db.query(
      `INSERT INTO accidents (occurred_at, location_name, lat, lng, fatalities, aircraft) VALUES
        ($1, 'Austin', 30.2672, -97.7431, 2, 'Cessna 172'),
        ($2, 'Lyon', 45.76, 4.83, NULL, NULL),
        ($3, 'Manaus', -3.1, -60.02, 3, NULL)`,
      [hoursAgo(2), hoursAgo(30), new Date(Date.UTC(y - 1, 5, 10))],
    );
    await db.query(
      `INSERT INTO articles (accident_id, source_id, url, title, published_at) VALUES
        (1, (SELECT id FROM sources WHERE slug = 'reuters'), 'https://e.com/1', 'Plane crashes near Austin', now()),
        (1, (SELECT id FROM sources WHERE slug = 'ntsb'), 'https://e.com/2', 'NTSB investigates Austin crash', now())`,
    );
    app = buildApp({ db, logger: false });
  });
  afterAll(async () => {
    await app?.close();
    await db?.end();
  });

  it('marcadores das últimas 24h em formato compacto', async () => {
    const res = await app.inject('/api/accidents?period=24h');
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toContain('max-age=60');
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.markers[0]).toEqual([1, 30.2672, -97.7431, 2, expect.any(Number)]);
  });

  it('marcadores de um ano anterior', async () => {
    const body = (await app.inject(`/api/accidents?period=month&year=${y - 1}`)).json();
    expect(body.markers.map((m: number[]) => m[0])).toEqual([3]);
    const june = (await app.inject(`/api/accidents?period=month&year=${y - 1}&month=6`)).json();
    expect(june.total).toBe(1);
  });

  it('contadores e anos disponíveis', async () => {
    const body = (await app.inject(`/api/stats?year=${y - 1}`)).json();
    expect(body).toMatchObject({ last24h: 1, yearTotal: 1, years: [y, y - 1] });
    expect(body.months[5]).toBe(1);
    expect(body.months).toHaveLength(12);
  });

  it('detalhe com a lista de fontes', async () => {
    const body = (await app.inject('/api/accidents/1')).json();
    expect(body.location).toBe('Austin');
    expect(body.articles).toHaveLength(2);
    expect(body.articles[0]).toMatchObject({ source: 'NTSB', sourceKind: 'government' });
  });

  it('valida parâmetros e 404', async () => {
    expect((await app.inject('/api/accidents?period=week')).statusCode).toBe(400);
    expect((await app.inject('/api/accidents/999')).statusCode).toBe(404);
  });

  it('ETag permite 304', async () => {
    const first = await app.inject('/api/accidents/1');
    const second = await app.inject({ url: '/api/accidents/1', headers: { 'if-none-match': first.headers.etag as string } });
    expect(second.statusCode).toBe(304);
  });
});
