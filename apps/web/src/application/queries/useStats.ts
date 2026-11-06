import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAccidentRepository } from '../AccidentRepositoryContext';
import { queryKeys } from './queryKeys';

export function useStats(year: number) {
  const repo = useAccidentRepository();
  return useQuery({
    queryKey: queryKeys.stats(year),
    queryFn: ({ signal }) => repo.getStats(year, signal),
    placeholderData: keepPreviousData,
  });
}
