/** Contratos compartilhados entre coletor, API e frontend. */

/** Marcador compacto: [id, lat, lng, fatalities (-1 = desconhecido), occurredAt (epoch s)]. */
export type MarkerTuple = [id: number, lat: number, lng: number, fatalities: number, occurredAt: number];

export interface MarkersResponse {
  from: string;
  to: string;
  /** Total de acidentes no período, inclusive os que ainda não têm coordenadas. */
  total: number;
  markers: MarkerTuple[];
}

export interface StatsResponse {
  year: number;
  last24h: number;
  currentMonth: number;
  yearTotal: number;
  /** 12 posições, janeiro a dezembro. */
  months: number[];
  /** Anos com pelo menos um acidente, em ordem decrescente. */
  years: number[];
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
