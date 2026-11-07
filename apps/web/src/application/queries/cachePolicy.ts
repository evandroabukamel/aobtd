/**
 * Collection runs in 6h windows: data for a filter already fetched won't change before that.
 * staleTime avoids a new request; gcTime keeps the result even after the filter leaves
 * the screen, so going back to it doesn't refetch.
 */
export const FILTER_CACHE_MS = 6 * 60 * 60_000;

export const filterCache = { staleTime: FILTER_CACHE_MS, gcTime: FILTER_CACHE_MS } as const;
