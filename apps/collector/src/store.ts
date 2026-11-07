import type { Db } from '@aobtd/core';

export interface AccidentCandidate {
  occurredAt: Date;
  location: string;
  lat: number;
  lng: number;
  country: string | null;
  aircraft?: string;
  fatalities?: number;
}

export interface ArticleInput {
  sourceId: number;
  url: string;
  title: string;
  publishedAt?: Date;
}

/** Time window and radius used to treat two articles as the same accident. */
export const MERGE_WINDOW_HOURS = 48;
export const MERGE_RADIUS_KM = 60;

/** Returns the URLs already stored, so repeated feed items are not processed again. */
export async function knownUrls(db: Db, urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const { rows } = await db.query<{ url: string }>('SELECT url FROM articles WHERE url = ANY($1::text[])', [urls]);
  return new Set(rows.map((r) => r.url));
}

/**
 * Stores the article and links it to an existing accident (same time window and radius)
 * or to a new one. Returns the accident id and whether it was just created.
 */
export async function saveArticle(
  db: Db,
  candidate: AccidentCandidate,
  article: ArticleInput,
): Promise<{ accidentId: number; created: boolean } | null> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // Serializes deduplication: two concurrent scans don't create the same accident twice.
    await client.query('SELECT pg_advisory_xact_lock(4242)');

    const exists = await client.query('SELECT 1 FROM articles WHERE url = $1', [article.url]);
    if (exists.rowCount) {
      await client.query('ROLLBACK');
      return null;
    }

    const latDelta = MERGE_RADIUS_KM / 111;
    const lngDelta = MERGE_RADIUS_KM / (111 * Math.max(Math.cos((candidate.lat * Math.PI) / 180), 0.05));
    const match = await client.query<{ id: number }>(
      `SELECT id FROM accidents
        WHERE occurred_at BETWEEN $1::timestamptz - make_interval(hours => $4::int) AND $1::timestamptz + make_interval(hours => $4::int)
          AND lat BETWEEN $2::float8 - $5::float8 AND $2::float8 + $5::float8
          AND lng BETWEEN $3::float8 - $6::float8 AND $3::float8 + $6::float8
        ORDER BY abs(extract(epoch FROM occurred_at - $1::timestamptz)) +
                 ((lat - $2::float8) ^ 2 + (lng - $3::float8) ^ 2) * 1000
        LIMIT 1`,
      [candidate.occurredAt, candidate.lat, candidate.lng, MERGE_WINDOW_HOURS, latDelta, lngDelta],
    );

    let accidentId: number;
    let created = false;
    if (match.rows[0]) {
      accidentId = match.rows[0].id;
      // Fills in data the new article brings and the earlier one lacked.
      await client.query(
        `UPDATE accidents SET
           aircraft   = COALESCE(aircraft, $2),
           fatalities = GREATEST(fatalities, $3::int),
           updated_at = now()
         WHERE id = $1`,
        [accidentId, candidate.aircraft ?? null, candidate.fatalities ?? null],
      );
    } else {
      const ins = await client.query<{ id: number }>(
        `INSERT INTO accidents (occurred_at, location_name, country, lat, lng, aircraft, fatalities)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          candidate.occurredAt,
          candidate.location,
          candidate.country,
          candidate.lat,
          candidate.lng,
          candidate.aircraft ?? null,
          candidate.fatalities ?? null,
        ],
      );
      accidentId = ins.rows[0]!.id;
      created = true;
    }

    await client.query(
      `INSERT INTO articles (accident_id, source_id, url, title, published_at) VALUES ($1, $2, $3, $4, $5)`,
      [accidentId, article.sourceId, article.url, article.title, article.publishedAt ?? null],
    );
    await client.query('COMMIT');
    return { accidentId, created };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
