/**
 * Error logging for the API. Only failures are logged, one structured object per error:
 * Cloudflare indexes the fields of a logged object (Workers Logs) and ships it whole in the
 * Logs field of Workers Trace Events (Logpush). Logpush caps Logs + Exceptions at 16,384
 * characters per invocation, so long texts are cut and the cause chain is bounded.
 */

/** Where in the request's life the error happened. */
export type ErrorPhase = 'handler' | 'worker' | 'db-close';

export interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  /** Driver fields that say what failed in the database (pg / TiDB), when present. */
  code?: string;
  errno?: number;
  severity?: string;
  detail?: string;
  hint?: string;
  routine?: string;
  syscall?: string;
  cause?: ErrorDetails;
}

export interface RequestDetails {
  method: string;
  path: string;
  query?: string;
  /** Cloudflare's request id (cf-ray): finds the same request in other Cloudflare logs. */
  ray?: string;
  /** Cloudflare data center that ran the Worker, and the visitor's country. */
  colo?: string;
  country?: string;
  origin?: string;
  userAgent?: string;
}

export interface ErrorRecord {
  level: 'error';
  event: 'api.error';
  phase: ErrorPhase;
  message: string;
  error: ErrorDetails;
  request?: RequestDetails;
  /** Time from the start of the request to the error. */
  durationMs?: number;
  timestamp: string;
}

export type ErrorLogger = (record: ErrorRecord) => void;

/** console.error with the object itself (not a string), so its fields stay searchable. */
export const consoleErrorLogger: ErrorLogger = (record) => console.error(record);

const MAX_TEXT = 300;
const MAX_STACK = 3000;
const MAX_CAUSES = 3;

/** Connection strings may carry a password; never let one reach the logs. */
const redact = (text: string): string =>
  text.replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi, '$1***:***@').replace(/(password=)[^\s&]+/gi, '$1***');

const cut = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max)}…[+${text.length - max}]` : text);

const text = (value: unknown, max = MAX_TEXT): string | undefined =>
  typeof value === 'string' && value !== '' ? cut(redact(value), max) : undefined;

export function describeError(err: unknown, depth = 0): ErrorDetails {
  if (!(err instanceof Error)) return { name: 'NonError', message: text(String(err)) ?? '' };
  const e = err as Error & Record<string, unknown>;
  const details: ErrorDetails = {
    name: e.name,
    message: text(e.message, 1000) ?? '',
    stack: text(e.stack, MAX_STACK),
    code: e.code === undefined ? undefined : String(e.code),
    errno: typeof e.errno === 'number' ? e.errno : undefined,
    severity: text(e.severity),
    detail: text(e.detail),
    hint: text(e.hint),
    routine: text(e.routine),
    syscall: text(e.syscall),
  };
  if (e.cause !== undefined && depth < MAX_CAUSES) details.cause = describeError(e.cause, depth + 1);
  // Drop empty keys: shorter lines, fewer characters against the Logpush limit.
  return Object.fromEntries(Object.entries(details).filter(([, v]) => v !== undefined)) as unknown as ErrorDetails;
}

/** Cloudflare's request.cf, when the request came through Cloudflare. */
interface CfProperties {
  colo?: string;
  country?: string;
}

export function describeRequest(request: Request): RequestDetails {
  const url = new URL(request.url);
  const cf = (request as Request & { cf?: CfProperties }).cf;
  const h = request.headers;
  const details: RequestDetails = {
    method: request.method,
    path: url.pathname,
    query: url.search ? cut(url.search, MAX_TEXT) : undefined,
    ray: h.get('cf-ray') ?? undefined,
    colo: cf?.colo,
    country: cf?.country,
    origin: h.get('origin') ?? undefined,
    userAgent: text(h.get('user-agent') ?? undefined, 200),
  };
  return Object.fromEntries(Object.entries(details).filter(([, v]) => v !== undefined)) as unknown as RequestDetails;
}

export function errorRecord(
  err: unknown,
  phase: ErrorPhase,
  request?: Request,
  startedAt?: number,
  now: () => number = Date.now,
): ErrorRecord {
  const error = describeError(err);
  const t = now();
  return {
    level: 'error',
    event: 'api.error',
    phase,
    message: `${error.name}: ${error.message}`,
    error,
    ...(request ? { request: describeRequest(request) } : {}),
    ...(startedAt === undefined ? {} : { durationMs: t - startedAt }),
    timestamp: new Date(t).toISOString(),
  };
}
