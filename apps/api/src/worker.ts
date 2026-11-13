import { createPool } from '@aobtd/core';
import { createApi, parseOrigins, readerFor } from './app.js';
import { consoleErrorLogger, errorRecord } from './errorLog.js';

/** Cloudflare Worker entry point (`aobtd-api`). DATABASE_URL is a secret of the Worker. */
interface Env {
  DATABASE_URL: string;
  /** Comma-separated origins of the site(s) calling the API from the browser, e.g. https://aobtd.example.com. */
  ALLOWED_ORIGINS?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<Response> {
    const startedAt = Date.now();
    // A Worker cannot reuse a connection across requests: one connection, closed after the response.
    let db: ReturnType<typeof createPool> | undefined;
    try {
      db = createPool(env.DATABASE_URL, 1);
      return await createApi(readerFor(db), undefined, { allowedOrigins: parseOrigins(env.ALLOWED_ORIGINS) }).fetch(request);
    } catch (err) {
      // Route errors are answered by the app; this catches what fails around it (setup, bundling, runtime).
      consoleErrorLogger(errorRecord(err, 'worker', request, startedAt));
      return Response.json({ error: 'Internal error' }, { status: 500 });
    } finally {
      // Closing runs after the response: a failure here is logged, not thrown into the void.
      if (db) ctx.waitUntil(db.end().catch((err: unknown) => consoleErrorLogger(errorRecord(err, 'db-close', request, startedAt))));
    }
  },
};
