import type { Db, SourceRow } from '@aobtd/core';
import { cleanTitle, extractAircraft, extractFatalities, extractLocations, extractOccurredAt, isMannedCrash, mentionsEarlierYear } from './extract.js';
import type { Geocoder } from './geocode.js';
import { fetchText, type FetchFn } from './http.js';
import { parseAsnList } from './parsers/asn.js';
import { parseFeed } from './parsers/rss.js';
import type { RawItem } from './parsers/types.js';
import { isDue, periodStart } from './schedule.js';
import { knownUrls, saveArticle } from './store.js';

export interface ScanDeps {
  db: Db;
  geocoder: Geocoder;
  fetchFn?: FetchFn;
  now?: () => Date;
  log?: (msg: string) => void;
}

export interface ScanSummary {
  source: string;
  status: 'ok' | 'not_modified' | 'error' | 'skipped';
  seen: number;
  relevant: number;
  newArticles: number;
  newAccidents: number;
  unlocated: number;
  error?: string;
}

/** Itens mais antigos que isso são ignorados: o monitor cobre o presente, não o histórico. */
const MAX_AGE_DAYS = 7;

export async function loadSources(db: Db): Promise<SourceRow[]> {
  const { rows } = await db.query<SourceRow>('SELECT * FROM sources ORDER BY scan_slot, id');
  return rows;
}

/**
 * Reserva a fonte para este período de forma atômica: se outro processo já a varreu
 * (ou está varrendo) neste período, devolve false. Garante uma varredura diária por fonte.
 */
export async function claimSource(db: Db, source: SourceRow, now: Date, force = false): Promise<boolean> {
  const res = await db.query(
    `UPDATE sources SET last_scan_at = $2
      WHERE id = $1 AND ($4::boolean OR last_scan_at IS NULL OR last_scan_at < $3)`,
    [source.id, now, periodStart(source.scan_slot, now), force],
  );
  return res.rowCount === 1;
}

function parse(source: SourceRow, body: string): RawItem[] {
  return source.parser === 'asn_html' ? parseAsnList(body, source.feed_url) : parseFeed(body);
}

async function locate(geocoder: Geocoder, candidates: string[]) {
  for (const place of candidates.slice(0, 3)) {
    const hit = await geocoder.geocode(place);
    if (hit) return { place, ...hit };
  }
  return null;
}

/** Opções da recuperação histórica: outra URL da mesma fonte e outra janela de datas. */
export interface ScanOptions {
  /** URL alternativa (ex.: busca do Google News restrita a um período). Desliga o GET condicional. */
  url?: string;
  /** Itens anteriores a esta data são ignorados. Padrão: últimos MAX_AGE_DAYS dias. */
  since?: Date;
}

export async function scanSource(deps: ScanDeps, source: SourceRow, opts: ScanOptions = {}): Promise<ScanSummary> {
  const { db, geocoder } = deps;
  const now = deps.now?.() ?? new Date();
  const summary: ScanSummary = {
    source: source.slug, status: 'ok', seen: 0, relevant: 0, newArticles: 0, newAccidents: 0, unlocated: 0,
  };
  const run = await db.query<{ id: number }>(
    `INSERT INTO scan_runs (source_id, status) VALUES ($1, 'running') RETURNING id`,
    [source.id],
  );
  const runId = run.rows[0]!.id;

  try {
    const res = await fetchText(opts.url ?? source.feed_url, {
      etag: opts.url ? null : source.etag,
      lastModified: opts.url ? null : source.last_modified,
      fetchFn: deps.fetchFn,
    });
    if (res.status === 'not_modified') {
      summary.status = 'not_modified';
    } else {
      const minDate = opts.since?.getTime() ?? now.getTime() - MAX_AGE_DAYS * 24 * 3600_000;
      const items = parse(source, res.body).filter(
        (i) => (i.occurredAt ?? i.publishedAt ?? now).getTime() >= minDate,
      );
      summary.seen = items.length;
      const known = await knownUrls(db, items.map((i) => i.url));

      for (const item of items) {
        if (known.has(item.url)) continue;
        const title = cleanTitle(item.title);
        const text = `${title}. ${item.summary ?? ''}`;
        if (!item.structured && (!isMannedCrash(text) || mentionsEarlierYear(title, item.publishedAt))) continue;
        summary.relevant++;

        const candidates = item.location ? [item.location, ...extractLocations(item.location)] : extractLocations(text);
        const where = await locate(geocoder, candidates);
        if (!where) {
          summary.unlocated++;
          continue;
        }
        const saved = await saveArticle(
          db,
          {
            occurredAt: item.occurredAt ?? extractOccurredAt(text, item.publishedAt, now),
            location: where.place,
            lat: where.lat,
            lng: where.lng,
            country: where.country,
            aircraft: item.aircraft ?? extractAircraft(text),
            fatalities: item.fatalities ?? extractFatalities(text),
          },
          { sourceId: source.id, url: item.url, title: item.title, publishedAt: item.publishedAt },
        );
        if (saved) {
          summary.newArticles++;
          if (saved.created) summary.newAccidents++;
        }
      }
    }
    if (!opts.url) {
      await db.query(
        `UPDATE sources SET etag = $2, last_modified = $3, last_status = $4, last_error = NULL WHERE id = $1`,
        [source.id, res.etag, res.lastModified, summary.status],
      );
    }
  } catch (err) {
    summary.status = 'error';
    summary.error = err instanceof Error ? err.message : String(err);
    await db.query(`UPDATE sources SET last_status = 'error', last_error = $2 WHERE id = $1`, [source.id, summary.error]);
  }

  await db.query(
    `UPDATE scan_runs SET finished_at = now(), status = $2, items_seen = $3, items_new = $4, error = $5 WHERE id = $1`,
    [runId, summary.status, summary.seen, summary.newArticles, summary.error ?? null],
  );
  deps.log?.(formatSummary(summary));
  return summary;
}

/** Varre, uma a uma, as fontes cuja janela diária chegou e que ainda não foram varridas no período. */
export async function runDueScans(deps: ScanDeps): Promise<ScanSummary[]> {
  const now = deps.now?.() ?? new Date();
  const results: ScanSummary[] = [];
  for (const source of await loadSources(deps.db)) {
    if (!source.enabled || !isDue(source.scan_slot, source.last_scan_at, now)) continue;
    if (!(await claimSource(deps.db, source, now))) continue;
    results.push(await scanSource(deps, source));
  }
  return results;
}

/** Linha curta por fonte: mantém pequenas as respostas do MCP (economia de tokens). */
export function formatSummary(s: ScanSummary): string {
  if (s.status === 'error') return `${s.source}: erro (${s.error})`;
  if (s.status === 'not_modified') return `${s.source}: sem novidades`;
  if (s.status === 'skipped') return `${s.source}: já varrida neste período`;
  return `${s.source}: ${s.seen} itens, ${s.relevant} relevantes, ${s.newArticles} notícias novas, ${s.newAccidents} acidentes novos, ${s.unlocated} sem local`;
}
