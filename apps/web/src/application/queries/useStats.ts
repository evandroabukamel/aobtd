import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { useAccidentRepository } from '../AccidentRepositoryContext';
import type { AccidentRepository } from '../ports/AccidentRepository';
import { filterCache } from './cachePolicy';
import { queryKeys } from './queryKeys';

export const statsQuery = (repo: AccidentRepository, year: number) =>
  queryOptions({
    queryKey: queryKeys.stats(year),
    queryFn: ({ signal }) => repo.getStats(year, signal),
    ...filterCache,
  });

export function useStats(year: number) {
  const repo = useAccidentRepository();
  return useQuery({ ...statsQuery(repo, year), placeholderData: keepPreviousData });
}
