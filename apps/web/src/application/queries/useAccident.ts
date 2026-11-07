import { useQuery } from '@tanstack/react-query';
import { useAccidentRepository } from '../AccidentRepositoryContext';
import { queryKeys } from './queryKeys';

/** Sources of one accident: only fetched while a marker is selected. */
export function useAccident(id: number | null) {
  const repo = useAccidentRepository();
  return useQuery({
    queryKey: queryKeys.accident(id ?? -1),
    queryFn: ({ signal }) => repo.getAccident(id!, signal),
    enabled: id !== null,
    staleTime: 30 * 60_000,
  });
}
