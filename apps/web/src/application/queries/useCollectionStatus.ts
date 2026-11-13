import { useQuery } from '@tanstack/react-query';
import { useAccidentRepository } from '../AccidentRepositoryContext';
import { queryKeys } from './queryKeys';

/** Last collection time and number of sources; changes at most once per 6h window. */
export function useCollectionStatus() {
  const repo = useAccidentRepository();
  return useQuery({
    queryKey: queryKeys.status(),
    queryFn: ({ signal }) => repo.getStatus(signal),
    staleTime: 15 * 60_000,
    gcTime: Infinity,
  });
}
