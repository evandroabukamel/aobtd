import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Filter } from '../../domain/filter';
import { useAccidentRepository } from '../AccidentRepositoryContext';
import { queryKeys } from './queryKeys';

export function useMarkers(filter: Filter) {
  const repo = useAccidentRepository();
  return useQuery({
    queryKey: queryKeys.markers(filter),
    queryFn: ({ signal }) => repo.listMarkers(filter, signal),
    placeholderData: keepPreviousData,
    staleTime: filter.kind === '24h' ? 60_000 : undefined,
  });
}
