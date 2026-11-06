import type { AccidentDetailResponse, MarkersResponse, StatsResponse } from '@aobtd/core';

export type Filter = { kind: '24h' } | { kind: 'period'; year: number; month?: number };

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Erro ${res.status} ao consultar ${path}`);
  return res.json() as Promise<T>;
}

export function markersPath(f: Filter): string {
  if (f.kind === '24h') return '/api/accidents?period=24h';
  const q = new URLSearchParams({ period: 'month', year: String(f.year) });
  if (f.month) q.set('month', String(f.month));
  return `/api/accidents?${q}`;
}

export const fetchMarkers = (f: Filter, signal?: AbortSignal) => get<MarkersResponse>(markersPath(f), signal);
export const fetchStats = (year: number, signal?: AbortSignal) => get<StatsResponse>(`/api/stats?year=${year}`, signal);
export const fetchAccident = (id: number, signal?: AbortSignal) => get<AccidentDetailResponse>(`/api/accidents/${id}`, signal);
