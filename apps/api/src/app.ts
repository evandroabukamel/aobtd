import {
  last24h, monthRange, type AccidentDetailResponse, type Db, type MarkersResponse, type Range, type StatsResponse,
  type StatusResponse,
} from '@aobtd/core';
import { Hono, type Context } from 'hono';
import { etag } from 'hono/etag';
import { z } from 'zod';
import { getAccident, getMarkers, getStats, getStatus } from './queries.js';

/**
 * Web-standard (Request -> Response) API, so the same app runs as a Cloudflare Worker
 * and, through @hono/node-server, in Node (Docker). Static files are not served here.
 */

/** Outbound port: what the API reads. `readerFor(db)` is the PostgreSQL implementation. */
export interface AccidentReader {
  markers(range: Range): Promise<MarkersResponse>;
  stats(year: number): Promise<StatsResponse>;
  accident(id: number): Promise<AccidentDetailResponse | null>;
  status(): Promise<StatusResponse>;
  health(): Promise<void>;
}

export const readerFor = (db: Db): AccidentReader => ({
  markers: (range) => getMarkers(db, range),
  stats: (year) => getStats(db, year),
  accident: (id) => getAccident(db, id),
  status: () => getStatus(db),
  health: async () => void (await db.query('SELECT 1')),
});

/** Data changes at most 4 times a day (one collection window every 6h). */
const CACHE = 'public, max-age=300, stale-while-revalidate=600';
const SHORT_CACHE = 'public, max-age=60';

/** Query strings are text: accept only plain integers in range. */
const int = (min: number, max: number) =>
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(min).max(max));
const year = int(1900, 2100);

const MarkersQuery = z.strictObject({ period: z.enum(['24h', 'month']), year: year.optional(), month: int(1, 12).optional() });
const StatsQuery = z.strictObject({ year: year.optional() });
const AccidentId = int(1, Number.MAX_SAFE_INTEGER);

/** Parses outside input once, at the edge; a failure becomes a 400. */
function parse<T>(c: Context, schema: z.ZodType<T>, input: unknown): T | Response {
  const result = schema.safeParse(input);
  return result.success ? result.data : c.json({ error: 'Invalid parameters', issues: z.flattenError(result.error).fieldErrors }, 400);
}

export function createApi(reader: AccidentReader, now: () => Date = () => new Date()): Hono {
  const app = new Hono();
  app.use('/api/*', etag());

  app.get('/api/accidents', async (c) => {
    const q = parse(c, MarkersQuery, c.req.query());
    if (q instanceof Response) return q;
    const t = now();
    const range =
      q.period === '24h'
        ? last24h(t)
        : // Without year and month: the current month; with a year only: the whole year.
          monthRange(q.year ?? t.getUTCFullYear(), q.year === undefined && q.month === undefined ? t.getUTCMonth() + 1 : q.month);
    // "Last 24h" is a moving window: shorter cache.
    c.header('cache-control', q.period === '24h' ? SHORT_CACHE : CACHE);
    return c.json(await reader.markers(range));
  });

  app.get('/api/stats', async (c) => {
    const q = parse(c, StatsQuery, c.req.query());
    if (q instanceof Response) return q;
    c.header('cache-control', SHORT_CACHE);
    return c.json(await reader.stats(q.year ?? now().getUTCFullYear()));
  });

  app.get('/api/accidents/:id', async (c) => {
    const id = parse(c, AccidentId, c.req.param('id'));
    if (id instanceof Response) return id;
    const accident = await reader.accident(id);
    if (!accident) return c.json({ error: 'Accident not found' }, 404);
    c.header('cache-control', CACHE);
    return c.json(accident);
  });

  app.get('/api/status', async (c) => {
    c.header('cache-control', CACHE);
    return c.json(await reader.status());
  });

  app.get('/api/health', async (c) => {
    await reader.health();
    return c.json({ ok: true });
  });

  // A route, not app.notFound: it must still answer when this app is mounted in the Node site.
  app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));
  // Logged for the operator; the client never sees database details.
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: 'Internal error' }, 500);
  });
  return app;
}
