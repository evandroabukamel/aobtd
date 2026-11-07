import { useCallback, useState } from 'react';
import { currentYearMonth } from '../domain/calendar';
import { Filters, type Filter } from '../domain/filter';

/** Screen state: map filter, counters year and selected accident. */
export function useDashboardState() {
  const [now] = useState(() => new Date());
  const [filter, setFilter] = useState<Filter>(() => {
    const { year, month } = currentYearMonth(now);
    return Filters.month(year, month);
  });
  const [year, setYear] = useState(() => currentYearMonth(now).year);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const changeFilter = useCallback((f: Filter) => {
    setFilter(f);
    setSelectedId(null);
  }, []);

  const changeYear = useCallback(
    (y: number) => {
      setYear(y);
      changeFilter(Filters.year(y));
    },
    [changeFilter],
  );

  const clearSelection = useCallback(() => setSelectedId(null), []);

  return { now, filter, year, selectedId, changeFilter, changeYear, selectAccident: setSelectedId, clearSelection };
}
