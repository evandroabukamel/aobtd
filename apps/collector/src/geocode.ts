import type { Db } from '@aobtd/core';
import { USER_AGENT, type FetchFn } from './http.js';

export interface GeoPoint {
  lat: number;
  lng: number;
  country: string | null;
}

export interface Geocoder {
  geocode(query: string): Promise<GeoPoint | null>;
}

const ACCEPTED_CATEGORIES = new Set(['place', 'boundary', 'natural', 'aeroway', 'waterway', 'water', 'landuse']);

/**
 * Nominatim (OpenStreetMap) geocoder with a permanent cache in PostgreSQL
 * (negative results included) and at most 1 request per second,
 * as the service usage policy asks.
 */
export class NominatimGeocoder implements Geocoder {
  private last = 0;
  private readonly memo = new Map<string, GeoPoint | null>();

  constructor(
    private readonly db: Db,
    private readonly opts: { baseUrl?: string; userAgent?: string; fetchFn?: FetchFn; minIntervalMs?: number } = {},
  ) {}

  async geocode(query: string): Promise<GeoPoint | null> {
    const key = query.trim().toLowerCase();
    if (!key) return null;
    if (this.memo.has(key)) return this.memo.get(key)!;

    const cached = await this.db.query<{ lat: number | null; lng: number | null; country: string | null }>(
      'SELECT lat, lng, country FROM geocode_cache WHERE query = $1',
      [key],
    );
    if (cached.rows[0]) {
      const r = cached.rows[0];
      const hit = r.lat === null || r.lng === null ? null : { lat: r.lat, lng: r.lng, country: r.country };
      this.memo.set(key, hit);
      return hit;
    }

    const point = await this.lookup(query);
    await this.db.query(
      `INSERT INTO geocode_cache (query, lat, lng, country) VALUES ($1, $2, $3, $4)
       ON CONFLICT (query) DO NOTHING`,
      [key, point?.lat ?? null, point?.lng ?? null, point?.country ?? null],
    );
    this.memo.set(key, point);
    return point;
  }

  private async lookup(query: string): Promise<GeoPoint | null> {
    const wait = this.last + (this.opts.minIntervalMs ?? 1100) - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.last = Date.now();

    const url = new URL('/search', this.opts.baseUrl ?? 'https://nominatim.openstreetmap.org');
    url.search = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', addressdetails: '1' }).toString();
    const res = await (this.opts.fetchFn ?? fetch)(url, {
      headers: { 'user-agent': this.opts.userAgent ?? process.env.GEOCODER_USER_AGENT ?? USER_AGENT },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`geocoding failed: HTTP ${res.status}`);
    const [hit] = (await res.json()) as Array<{
      lat: string;
      lon: string;
      category?: string;
      address?: { country_code?: string };
    }>;
    if (!hit || (hit.category && !ACCEPTED_CATEGORIES.has(hit.category))) return null;
    return { lat: Number(hit.lat), lng: Number(hit.lon), country: hit.address?.country_code?.toUpperCase() ?? null };
  }
}
