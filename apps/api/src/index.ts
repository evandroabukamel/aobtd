import { serve } from '@hono/node-server';
import { createPool, migrate } from '@aobtd/core';
import { createApi, readerFor } from './app.js';
import { createSite } from './site.js';

// Node (Docker) entry point. On Cloudflare, worker.ts is the entry point instead.
const db = createPool();
await migrate(db);
const site = createSite(createApi(readerFor(db)), process.env.WEB_DIST);

const port = Number(process.env.API_PORT ?? 3000);
const server = serve({ fetch: site.fetch, port, hostname: process.env.API_HOST ?? '0.0.0.0' }, () =>
  console.log(`API listening on :${port}`),
);

const close = () => server.close(() => void db.end().finally(() => process.exit(0)));
process.on('SIGINT', close);
process.on('SIGTERM', close);
