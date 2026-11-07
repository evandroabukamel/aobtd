import {
  currentMonthRange, last24h, type AccidentDetailResponse, type Db, type MarkerTuple, type MarkersResponse,
  type Range, type StatsResponse, type StatusResponse,
} from '@aobtd/core';

export async function getMarkers(db: Db, range: Range): Promise<MarkersResponse> {
  // Only reads columns of the covering index accidents_occurred_at_idx.
  const { rows } = await db.query<{ id: number; lat: number; lng: number; fatalities: number | null; t: number }>(
    `SELECT id, lat, lng, fatalities, extract(epoch FROM occurred_at)::int AS t
       FROM accidents
      WHERE occurred_at >= $1 AND occurred_at < $2 AND lat IS NOT NULL
      ORDER BY occurred_at DESC
      LIMIT 5000`,
    [range.from, range.to],
  );
  const markers: MarkerTuple[] = rows.map((r) => [
    r.id,
    Math.round(r.lat * 1e4) / 1e4,
    Math.round(r.lng * 1e4) / 1e4,
    r.fatalities ?? -1,
    r.t,
  ]);
  return { from: range.from.toISOString(), to: range.to.toISOString(), total: markers.length, markers };
}

/** All counters in a single database round trip. */
export async function getStats(db: Db, year: number, now = new Date()): Promise<StatsResponse> {
  const h24 = last24h(now);
  const month = currentMonthRange(now);
  const [counts, years] = await Promise.all([
    db.query<{ last24h: number; current_month: number; months: number[] }>(
      `SELECT
         count(*) FILTER (WHERE occurred_at >= $1 AND occurred_at < $2) AS last24h,
         count(*) FILTER (WHERE occurred_at >= $3 AND occurred_at < $4) AS current_month,
         (SELECT array_agg(coalesce(c, 0) ORDER BY m)
            FROM generate_series(1, 12) m
            LEFT JOIN (
              SELECT extract(month FROM occurred_at AT TIME ZONE 'UTC')::int AS mm, count(*)::int AS c
                FROM accidents
               WHERE occurred_at >= make_timestamptz($5::int, 1, 1, 0, 0, 0, 'UTC')
                 AND occurred_at <  make_timestamptz($5::int + 1, 1, 1, 0, 0, 0, 'UTC')
                 AND lat IS NOT NULL
               GROUP BY 1) x ON x.mm = m) AS months
       FROM accidents
      WHERE occurred_at >= LEAST($1::timestamptz, $3::timestamptz) AND lat IS NOT NULL`,
      [h24.from, h24.to, month.from, month.to, year],
    ),
    db.query<{ y: number }>(
      `SELECT DISTINCT extract(year FROM occurred_at AT TIME ZONE 'UTC')::int AS y FROM accidents ORDER BY y DESC`,
    ),
  ]);
  const row = counts.rows[0]!;
  const months = row.months.map(Number);
  const yearList = years.rows.map((r) => r.y);
  if (!yearList.includes(now.getUTCFullYear())) yearList.unshift(now.getUTCFullYear());
  return {
    year,
    last24h: Number(row.last24h),
    currentMonth: Number(row.current_month),
    yearTotal: months.reduce((a, b) => a + b, 0),
    months,
    years: yearList,
  };
}

export async function getAccident(db: Db, id: number): Promise<AccidentDetailResponse | null> {
  const { rows } = await db.query<{
    id: number; occurred_at: Date; location_name: string | null; country: string | null; aircraft: string | null;
    fatalities: number | null; articles: AccidentDetailResponse['articles'];
  }>(
    `SELECT a.id, a.occurred_at, a.location_name, a.country, a.aircraft, a.fatalities,
            coalesce(json_agg(json_build_object(
              'title', r.title, 'url', r.url, 'source', s.name, 'sourceKind', s.kind,
              'publishedAt', r.published_at) ORDER BY (s.kind = 'agency'), r.published_at) FILTER (WHERE r.id IS NOT NULL), '[]') AS articles
       FROM accidents a
       LEFT JOIN articles r ON r.accident_id = a.id
       LEFT JOIN sources s ON s.id = r.source_id
      WHERE a.id = $1
      GROUP BY a.id`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    occurredAt: r.occurred_at.toISOString(),
    location: r.location_name,
    country: r.country,
    aircraft: r.aircraft,
    fatalities: r.fatalities,
    articles: r.articles,
  };
}

/** Last successful collection and number of monitored sources (one indexed lookup per source). */
export async function getStatus(db: Db): Promise<StatusResponse> {
  const { rows } = await db.query<{ sources: number; last: Date | null }>(
    `SELECT count(*)::int AS sources, max(r.finished_at) AS last
       FROM sources s
       LEFT JOIN LATERAL (
         SELECT finished_at FROM scan_runs
          WHERE source_id = s.id AND finished_at IS NOT NULL AND status <> 'error'
          ORDER BY started_at DESC
          LIMIT 1) r ON TRUE
      WHERE s.enabled`,
  );
  const row = rows[0]!;
  return { sources: Number(row.sources), lastScanAt: row.last ? row.last.toISOString() : null };
}
