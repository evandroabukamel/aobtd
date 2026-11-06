import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { Filter } from '../../domain/filter';
import { useAccidentRepository } from '../AccidentRepositoryContext';
import type { AccidentRepository } from '../ports/AccidentRepository';
import { filterCache } from './cachePolicy';
import { queryKeys } from './queryKeys';

export const markersQuery = (repo: AccidentRepository, filter: Filter) =>
  queryOptions({
    queryKey: queryKeys.markers(filter),
    queryFn: ({ signal }) => repo.listMarkers(filter, signal),
    ...filterCache,
  });

export function useMarkers(filter: Filter) {
  const repo = useAccidentRepository();
  return useQuery({ ...markersQuery(repo, filter), placeholderData: keepPreviousData });
}
