/**
 * Cloudflare Worker entry point (`aobtd-web`). Static assets (dist/) are served by Cloudflare
 * with SPA fallback; only /api/* reaches this code (run_worker_first in wrangler.jsonc) and is
 * handed to the API Worker through a service binding: one origin, no CORS, no API URL to set.
 */
interface Env {
  API: { fetch(request: Request): Promise<Response> };
}

export default {
  fetch: (request: Request, env: Env): Promise<Response> => env.API.fetch(request),
};
