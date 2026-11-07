/** Contracts shared between the collector, the API and the frontend. */

/** Marcador compacto: [id, lat, lng, fatalities (-1 = desconhecido), occurredAt (epoch s)]. */
export type MarkerTuple = [id: number, lat: number, lng: number, fatalities: number, occurredAt: number];

export interface MarkersResponse {
  from: string;
  to: string;
  /** Total accidents in the period, including those without coordinates yet. */
  total: number;
  markers: MarkerTuple[];
}

export interface StatsResponse {
  year: number;
  last24h: number;
  currentMonth: number;
  yearTotal: number;
  /** 12 slots, January to December. */
  months: number[];
  /** Years with at least one accident, in descending order. */
  years: number[];
}

/** Collection health shown on the site: builds trust in the numbers. */
export interface StatusResponse {
  /** End of the most recent successful scan of any enabled source (ISO 8601), or null before the first one. */
  lastScanAt: string | null;
  /** Number of enabled monitored sources. */
  sources: number;
}

export interface ArticleDto {
  title: string;
  url: string;
  source: string;
  sourceKind: SourceKind;
  publishedAt: string | null;
}

export interface AccidentDetailResponse {
  id: number;
  occurredAt: string;
  location: string | null;
  country: string | null;
  aircraft: string | null;
  fatalities: number | null;
  articles: ArticleDto[];
}

export type SourceKind = 'government' | 'database' | 'agency';
export type SourceParser = 'rss' | 'asn_html';

export interface SourceRow {
  id: number;
  slug: string;
  name: string;
  kind: SourceKind;
  country: string | null;
  homepage: string;
  feed_url: string;
  parser: SourceParser;
  scan_slot: number;
  enabled: boolean;
  etag: string | null;
  last_modified: string | null;
  last_scan_at: Date | null;
  last_status: string | null;
  last_error: string | null;
}
