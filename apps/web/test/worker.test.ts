import { describe, expect, it, vi } from 'vitest';
import worker from '../src/worker';

describe('web Worker', () => {
  it('hands API requests to the API Worker unchanged and returns its answer', async () => {
    const answer = new Response('{"ok":true}', { status: 200, headers: { 'cache-control': 'public, max-age=60' } });
    const api = { fetch: vi.fn(async () => answer) };
    const request = new Request('https://aobtd.example/api/stats?year=2026', { headers: { 'if-none-match': 'W/"x"' } });

    const res = await worker.fetch(request, { API: api });

    expect(api.fetch).toHaveBeenCalledWith(request);
    expect(res).toBe(answer);
  });
});
