/** Cliente HTTP enxuto: timeout, limite de tamanho e GET condicional (ETag / Last-Modified). */

export const USER_AGENT =
  process.env.COLLECTOR_USER_AGENT ?? 'aobtd-crash-monitor/1.0 (+https://github.com/evandroabukamel/aobtd)';

const MAX_BYTES = 5 * 1024 * 1024;

export interface FetchResult {
  status: 'ok' | 'not_modified';
  body: string;
  etag: string | null;
  lastModified: string | null;
}

export type FetchFn = typeof fetch;

export async function fetchText(
  url: string,
  opts: { etag?: string | null; lastModified?: string | null; timeoutMs?: number; fetchFn?: FetchFn } = {},
): Promise<FetchResult> {
  const headers: Record<string, string> = {
    'user-agent': USER_AGENT,
    accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.5',
  };
  if (opts.etag) headers['if-none-match'] = opts.etag;
  if (opts.lastModified) headers['if-modified-since'] = opts.lastModified;

  const res = await (opts.fetchFn ?? fetch)(url, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
  });
  if (res.status === 304) {
    return { status: 'not_modified', body: '', etag: opts.etag ?? null, lastModified: opts.lastModified ?? null };
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  const length = Number(res.headers.get('content-length') ?? 0);
  if (length > MAX_BYTES) throw new Error(`resposta grande demais (${length} bytes)`);
  const body = await res.text();
  if (body.length > MAX_BYTES) throw new Error('resposta grande demais');
  return { status: 'ok', body, etag: res.headers.get('etag'), lastModified: res.headers.get('last-modified') };
}
