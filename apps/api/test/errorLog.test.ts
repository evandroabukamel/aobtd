import { describe, expect, it } from 'vitest';
import { describeError, errorRecord } from '../src/errorLog.js';

/** Shape of a pg / TiDB driver error. */
const dbError = () =>
  Object.assign(new Error('relation "accidents" does not exist'), {
    code: '42P01',
    severity: 'ERROR',
    routine: 'parserOpenTable',
    hint: 'check migrations',
  });

describe('error log record', () => {
  it('keeps the database fields that say what failed', () => {
    expect(describeError(dbError())).toMatchObject({
      name: 'Error',
      code: '42P01',
      severity: 'ERROR',
      routine: 'parserOpenTable',
      hint: 'check migrations',
    });
  });

  it('follows the cause chain, up to a limit', () => {
    let err: Error = new Error('root');
    for (let i = 0; i < 6; i++) err = new Error(`level ${i}`, { cause: err });
    let depth = 0;
    for (let d = describeError(err); d.cause; d = d.cause) depth++;
    expect(depth).toBe(3);
    expect(describeError(new Error('outer', { cause: dbError() })).cause).toMatchObject({ code: '42P01' });
  });

  it('never logs a password from a connection string', () => {
    const d = describeError(new Error('connect failed for postgres://aobtd:s3cret@db.example:4000/aobtd password=s3cret'));
    expect(JSON.stringify(d)).not.toContain('s3cret');
    expect(d.message).toContain('postgres://***:***@db.example:4000/aobtd');
  });

  it('cuts long texts to stay under the Logpush size limit', () => {
    const d = describeError(new Error('x'.repeat(5000)));
    expect(d.message.length).toBeLessThan(1100);
    expect(JSON.stringify(errorRecord(new Error('y'.repeat(50_000)), 'worker')).length).toBeLessThan(6000);
  });

  it('describes values thrown that are not errors', () => {
    expect(describeError('boom')).toEqual({ name: 'NonError', message: 'boom' });
  });

  it('adds the request and Cloudflare details without headers that carry secrets', () => {
    const request = new Request('https://api.example/api/stats?year=2026', {
      headers: { 'cf-ray': 'abc-GRU', origin: 'https://site.example', authorization: 'Bearer secret', cookie: 'a=b' },
    });
    Object.assign(request, { cf: { colo: 'GRU', country: 'BR' } });
    const record = errorRecord(new Error('boom'), 'worker', request, 1000, () => 1250);
    expect(record).toMatchObject({
      phase: 'worker',
      durationMs: 250,
      timestamp: new Date(1250).toISOString(),
      request: { method: 'GET', path: '/api/stats', query: '?year=2026', ray: 'abc-GRU', colo: 'GRU', country: 'BR', origin: 'https://site.example' },
    });
    expect(JSON.stringify(record)).not.toMatch(/secret|cookie/i);
  });
});
