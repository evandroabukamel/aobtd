import type { AccidentRepository } from '../../application/ports/AccidentRepository';
import type { AccidentDetail, AccidentMarkers, AccidentStats } from '../../domain/accident';
import type { Filter } from '../../domain/filter';
import { fetchJson, type HttpGet } from './httpClient';

export function markersPath(f: Filter): string {
  if (f.kind === '24h') return '/api/accidents?period=24h';
  const q = new URLSearchParams({ period: 'month', year: String(f.year) });
  if (f.month) q.set('month', String(f.month));
  return `/api/accidents?${q}`;
}

/** Implementação do repositório sobre a API HTTP (`apps/api`). */
export function createHttpAccidentRepository(get: HttpGet = fetchJson): AccidentRepository {
  return {
    listMarkers: (filter, signal) => get<AccidentMarkers>(markersPath(filter), signal),
    getStats: (year, signal) => get<AccidentStats>(`/api/stats?year=${year}`, signal),
    getAccident: (id, signal) => get<AccidentDetail>(`/api/accidents/${id}`, signal),
  };
}
