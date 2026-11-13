import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { serveStatic, type ServeStaticOptions } from '@hono/node-server/serve-static';
import { Hono, type MiddlewareHandler } from 'hono';
import { compress } from 'hono/compress';

/** Hashed file names change with their content: cache them for a year. */
const IMMUTABLE = 'public, max-age=31536000, immutable';

/**
 * Static file handler that stamps a cache policy on the files it serves. (serveStatic's onFound
 * runs after the response is built, so a header set there is lost.)
 */
function cached(cacheControl: string, options: ServeStaticOptions): MiddlewareHandler {
  const serve = serveStatic(options);
  return async (c, next) => {
    const res = await serve(c, next);
    if (res instanceof Response) res.headers.set('cache-control', cacheControl);
    return res;
  };
}

/**
 * Node (Docker) deployment: the API plus the built web app, as one origin.
 * On Cloudflare the web Worker serves the files and forwards /api/* to the API Worker instead.
 */
export function createSite(api: Hono, webDist: string | undefined): Hono {
  const site = new Hono();
  site.use(compress());
  site.route('/', api);
  if (!webDist || !existsSync(webDist)) return site;

  const root = resolve(webDist);
  site.use('/assets/*', cached(IMMUTABLE, { root }));
  site.use('*', cached('no-cache', { root }));
  // Client-side routes: the app shell, revalidated so a new deploy is picked up.
  site.get('*', cached('no-cache', { root, path: 'index.html' }));
  return site;
}
