import type { Filter } from '../../domain/filter';

export const queryKeys = {
  markers: (filter: Filter) => ['markers', filter] as const,
  stats: (year: number) => ['stats', year] as const,
  accident: (id: number) => ['accident', id] as const,
  status: () => ['status'] as const,
};
