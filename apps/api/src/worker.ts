import { createPool } from '@aobtd/core';
import { createApi, readerFor } from './app.js';

/** Cloudflare Worker entry point (`aobtd-api`). DATABASE_URL is a secret of the Worker. */
interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<Response> {
    // A Worker cannot reuse a connection across requests: one connection, closed after the response.
    const db = createPool(env.DATABASE_URL, 1);
    try {
      return await createApi(readerFor(db)).fetch(request);
    } finally {
      ctx.waitUntil(db.end());
    }
  },
};
