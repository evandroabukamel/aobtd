import { describe, expect, it } from 'vitest';
import { readApiBaseUrl } from '../src/config/api';
import { Filters } from '../src/domain/filter';
import { createHttpAccidentRepository, markersPath } from '../src/infrastructure/http/HttpAccidentRepository';

describe('HTTP repository', () => {
  it('builds the markers URL from the filter', () => {
    expect(markersPath(Filters.last24h())).toBe('/api/accidents?period=24h');
    expect(markersPath(Filters.year(2025))).toBe('/api/accidents?period=month&year=2025');
    expect(markersPath(Filters.month(2026, 3))).toBe('/api/accidents?period=month&year=2026&month=3');
  });

  it('calls the API endpoints', async () => {
    const calls: string[] = [];
    const repo = createHttpAccidentRepository('', async <T>(path: string) => {
      calls.push(path);
      return {} as T;
    });
    await repo.listMarkers(Filters.last24h());
    await repo.getStats(2026);
    await repo.getAccident(42);
    await repo.getStatus();
    expect(calls).toEqual(['/api/accidents?period=24h', '/api/stats?year=2026', '/api/accidents/42', '/api/status']);
  });

  it('prefixes every path with the API origin when one is set', async () => {
    const calls: string[] = [];
    const repo = createHttpAccidentRepository('https://api.example.com', async <T>(path: string) => {
      calls.push(path);
      return {} as T;
    });
    await repo.getStatus();
    await repo.getAccident(42);
    expect(calls).toEqual(['https://api.example.com/api/status', 'https://api.example.com/api/accidents/42']);
  });
});

describe('API origin setting', () => {
  it('uses the configured https origin without a trailing slash', () => {
    expect(readApiBaseUrl({ VITE_API_URL: 'https://api.example.com/' } as ImportMetaEnv)).toBe('https://api.example.com');
  });

  it('falls back to the same origin when unset or not https', () => {
    expect(readApiBaseUrl({} as ImportMetaEnv)).toBe('');
    expect(readApiBaseUrl({ VITE_API_URL: 'http://api.example.com' } as ImportMetaEnv)).toBe('');
    expect(readApiBaseUrl({ VITE_API_URL: 'not a url' } as ImportMetaEnv)).toBe('');
  });
});
