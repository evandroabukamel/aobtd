import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccidentRepository } from '../src/application/ports/AccidentRepository';
import { FILTER_CACHE_MS } from '../src/application/queries/cachePolicy';
import { markersQuery } from '../src/application/queries/useMarkers';
import { statsQuery } from '../src/application/queries/useStats';
import { createQueryClient } from '../src/app/queryClient';
import { Filters } from '../src/domain/filter';

function fakeRepo() {
  return {
    listMarkers: vi.fn(async () => ({ from: '', to: '', total: 0, markers: [] })),
    getStats: vi.fn(async (year: number) => ({ year, last24h: 0, currentMonth: 0, yearTotal: 0, months: [], years: [] })),
    getAccident: vi.fn(),
  } satisfies AccidentRepository;
}

describe('filter cache', () => {
  let client: QueryClient;
  beforeEach(() => {
    vi.useFakeTimers();
    client = createQueryClient();
  });
  afterEach(() => {
    client.clear();
    vi.useRealTimers();
  });

  it.each([Filters.last24h(), Filters.month(2026, 3), Filters.year(2025)])('does not refetch %o', async (filter) => {
    const repo = fakeRepo();
    await client.fetchQuery(markersQuery(repo, filter));
    await client.fetchQuery(markersQuery(repo, Filters.month(2020, 1)));
    // Well past the default 5 min cache and the default 30 min gcTime.
    await vi.advanceTimersByTimeAsync(5 * 60 * 60_000);
    await client.fetchQuery(markersQuery(repo, filter));
    expect(repo.listMarkers).toHaveBeenCalledTimes(2);
  });

  it('fetches again after 6 hours', async () => {
    const repo = fakeRepo();
    await client.fetchQuery(markersQuery(repo, Filters.month(2026, 3)));
    await vi.advanceTimersByTimeAsync(FILTER_CACHE_MS + 1);
    await client.fetchQuery(markersQuery(repo, Filters.month(2026, 3)));
    expect(repo.listMarkers).toHaveBeenCalledTimes(2);
  });

  it('keeps the counters of each year', async () => {
    const repo = fakeRepo();
    await client.fetchQuery(statsQuery(repo, 2026));
    await client.fetchQuery(statsQuery(repo, 2025));
    await vi.advanceTimersByTimeAsync(5 * 60 * 60_000);
    await client.fetchQuery(statsQuery(repo, 2026));
    expect(repo.getStats).toHaveBeenCalledTimes(2);
  });
});
