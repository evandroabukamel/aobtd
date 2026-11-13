import type { Db } from '@aobtd/core';
import { describe, expect, it, vi } from 'vitest';
import type { ScanDeps } from '../src/scanner.js';
import { createWorker, type Env } from '../src/worker.js';

/** Dependencies that fail loudly if a test reaches the database. */
function fakeOpen() {
  const close = vi.fn(async () => {});
  const deps: ScanDeps = {
    db: { query: () => Promise.reject(new Error('no database in tests')) } as unknown as Db,
    geocoder: { geocode: async () => null } as unknown as ScanDeps['geocoder'],
    log: () => {},
  };
  return { open: vi.fn(() => ({ deps, close })), close };
}

/** Collects ctx.waitUntil promises so a test can await the work left after the response. */
function context() {
  const pending: Promise<unknown>[] = [];
  return { ctx: { waitUntil: (p: Promise<unknown>) => void pending.push(p) }, settle: () => Promise.all(pending) };
}

const env: Env = { DATABASE_URL: 'postgres://unused', MCP_TOKEN: 's3cret' };
const mcpCall = (token: string | undefined, method = 'tools/list') =>
  new Request('https://collector.example/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: {} }),
  });

describe('collector Worker', () => {
  it('answers the health check without opening the database', async () => {
    const { open } = fakeOpen();
    const { ctx } = context();
    const res = await createWorker(open).fetch(new Request('https://c.example/health'), env, ctx);
    expect(res.status).toBe(200);
    expect(open).not.toHaveBeenCalled();
  });

  it('keeps MCP closed without the right bearer token', async () => {
    const { open } = fakeOpen();
    const { ctx } = context();
    const worker = createWorker(open);
    for (const token of [undefined, 'wrong', 's3cret-but-longer']) {
      const res = await worker.fetch(mcpCall(token), env, ctx);
      expect(res.status).toBe(401);
    }
    expect(open).not.toHaveBeenCalled();
  });

  it('turns MCP off entirely when no token is configured', async () => {
    const { open } = fakeOpen();
    const { ctx } = context();
    const res = await createWorker(open).fetch(mcpCall('anything'), { DATABASE_URL: 'postgres://unused' }, ctx);
    expect(res.status).toBe(404);
    expect(open).not.toHaveBeenCalled();
  });

  it('serves MCP to an authorised client and closes the database afterwards', async () => {
    const { open, close } = fakeOpen();
    const { ctx, settle } = context();
    const res = await createWorker(open).fetch(mcpCall('s3cret'), env, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.tools.map((t: { name: string }) => t.name)).toEqual(
      expect.arrayContaining(['list_sources', 'run_due_scans', 'scan_source', 'query_accidents']),
    );
    await settle();
    expect(close).toHaveBeenCalledOnce();
  });

  it('answers other paths with 404', async () => {
    const { open } = fakeOpen();
    const { ctx } = context();
    expect((await createWorker(open).fetch(new Request('https://c.example/'), env, ctx)).status).toBe(404);
  });

  it('runs the due scans on the cron trigger and always closes the database', async () => {
    const { open, close } = fakeOpen();
    const scan = vi.fn(async () => []);
    const { ctx, settle } = context();
    await createWorker(open, scan).scheduled({}, env, ctx);
    await settle();
    expect(scan).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();

    const failing = fakeOpen();
    const run = context();
    await expect(
      createWorker(failing.open, async () => Promise.reject(new Error('feed down'))).scheduled({}, env, run.ctx),
    ).rejects.toThrow('feed down');
    await run.settle();
    expect(failing.close).toHaveBeenCalledOnce();
  });
});
