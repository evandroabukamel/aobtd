import { createPool } from '@aobtd/core';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { NominatimGeocoder } from './geocode.js';
import { createMcpServer } from './mcp.js';
import { runDueScans, type ScanDeps } from './scanner.js';

/**
 * Cloudflare Worker entry point (`aobtd-collector`). The cron trigger replaces the Node
 * scheduler's setInterval; the once-per-window control stays in the database (claimSource),
 * so overlapping runs, or this Worker and the Docker collector together, never scan twice.
 * /mcp is the stateless Streamable HTTP endpoint, behind a bearer token: two of its tools
 * start scans, and a Worker is on the public internet.
 */
export interface Env {
  DATABASE_URL: string;
  /** Bearer token for /mcp. Not set: /mcp is off. */
  MCP_TOKEN?: string;
}

interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

export type OpenDeps = (env: Env) => { deps: ScanDeps; close: () => Promise<void> };

/** A Worker cannot keep connections between invocations: a small pool per invocation. */
export const openDeps: OpenDeps = (env) => {
  const db = createPool(env.DATABASE_URL, 3);
  const log = (msg: string) => console.log(`[collector] ${msg}`);
  return { deps: { db, geocoder: new NominatimGeocoder(db), log }, close: () => db.end() };
};

/** Compares in time independent of where the strings differ. */
function sameSecret(given: string, expected: string): boolean {
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a[i] ?? 0) ^ b[i]!;
  return diff === 0;
}

const authorised = (request: Request, token: string) => {
  const header = request.headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') && sameSecret(header.slice('Bearer '.length), token);
};

export function createWorker(open: OpenDeps = openDeps, scan: (deps: ScanDeps) => Promise<unknown[]> = runDueScans) {
  return {
    async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
      const { pathname } = new URL(request.url);
      if (pathname === '/health') return new Response('ok');
      if (pathname !== '/mcp' || !env.MCP_TOKEN) return new Response('Not found', { status: 404 });
      if (!authorised(request, env.MCP_TOKEN)) {
        return new Response('Unauthorized', { status: 401, headers: { 'www-authenticate': 'Bearer' } });
      }

      const { deps, close } = open(env);
      const server = createMcpServer(deps);
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      try {
        await server.connect(transport);
        return await transport.handleRequest(request);
      } finally {
        ctx.waitUntil(server.close().finally(close));
      }
    },

    async scheduled(_controller: unknown, env: Env, ctx: Ctx): Promise<void> {
      const { deps, close } = open(env);
      try {
        const scanned = await scan(deps);
        deps.log?.(`cron: ${scanned.length} source(s) scanned`);
      } finally {
        ctx.waitUntil(close());
      }
    },
  };
}

export default createWorker();
