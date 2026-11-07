import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import compress from '@fastify/compress';
import etag from '@fastify/etag';
import fastifyStatic from '@fastify/static';
import { last24h, monthRange, type Db } from '@aobtd/core';
import Fastify, { type FastifyInstance } from 'fastify';
import { getAccident, getMarkers, getStats, getStatus } from './queries.js';

/** Data changes at most 4 times a day (one collection window every 6h). */
const CACHE = 'public, max-age=300, stale-while-revalidate=600';

export interface AppOptions {
  db: Db;
  webDist?: string;
  logger?: boolean;
}

export function buildApp({ db, webDist, logger = true }: AppOptions): FastifyInstance {
  const app = Fastify({ logger });
  app.register(etag);
  app.register(compress, { threshold: 1024 });

  app.get<{ Querystring: { period: '24h' | 'month'; year?: number; month?: number } }>(
    '/api/accidents',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['period'],
          properties: {
            period: { type: 'string', enum: ['24h', 'month'] },
            year: { type: 'integer', minimum: 1900, maximum: 2100 },
            month: { type: 'integer', minimum: 1, maximum: 12 },
          },
          additionalProperties: false,
        },
      },
    },
    async (req, reply) => {
      const { period, year, month } = req.query;
      const now = new Date();
      const range =
        period === '24h'
          ? last24h(now)
          : monthRange(year ?? now.getUTCFullYear(), year === undefined && month === undefined ? now.getUTCMonth() + 1 : month);
      // "Last 24h" is a moving window: shorter cache.
      reply.header('cache-control', period === '24h' ? 'public, max-age=60' : CACHE);
      return getMarkers(db, range);
    },
  );

  app.get<{ Querystring: { year?: number } }>(
    '/api/stats',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { year: { type: 'integer', minimum: 1900, maximum: 2100 } },
          additionalProperties: false,
        },
      },
    },
    async (req, reply) => {
      reply.header('cache-control', 'public, max-age=60');
      return getStats(db, req.query.year ?? new Date().getUTCFullYear());
    },
  );

  app.get<{ Params: { id: number } }>(
    '/api/accidents/:id',
    { schema: { params: { type: 'object', properties: { id: { type: 'integer', minimum: 1 } }, required: ['id'] } } },
    async (req, reply) => {
      const accident = await getAccident(db, req.params.id);
      if (!accident) return reply.code(404).send({ error: 'Accident not found' });
      reply.header('cache-control', CACHE);
      return accident;
    },
  );

  app.get('/api/status', async (_req, reply) => {
    reply.header('cache-control', CACHE);
    return getStatus(db);
  });

  app.get('/api/health', async () => {
    await db.query('SELECT 1');
    return { ok: true };
  });

  const dist = webDist ? resolve(webDist) : undefined;
  if (dist && existsSync(dist)) {
    app.register(fastifyStatic, {
      root: dist,
      // Files with a hash in their name can be cached for a year.
      setHeaders: (res, path) => {
        res.header('cache-control', path.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    });
    app.setNotFoundHandler((req, reply) =>
      req.url.startsWith('/api/') ? reply.code(404).send({ error: 'Not found' }) : reply.sendFile('index.html'),
    );
  }
  return app;
}
