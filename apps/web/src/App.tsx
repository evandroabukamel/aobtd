import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { AccidentPanel } from './AccidentPanel';
import { fetchMarkers, fetchStats, type Filter } from './api';
import { Counters } from './Counters';
import { MONTHS_LONG } from './format';

// Leaflet só é baixado quando o mapa é montado (chunk separado).
const CrashMap = lazy(() => import('./CrashMap'));

function describe(f: Filter): string {
  if (f.kind === '24h') return 'Últimas 24 horas';
  return f.month ? `${MONTHS_LONG[f.month - 1]} de ${f.year}` : `Ano de ${f.year}`;
}

export function App() {
  const now = useMemo(() => new Date(), []);
  const [filter, setFilter] = useState<Filter>({
    kind: 'period', year: now.getUTCFullYear(), month: now.getUTCMonth() + 1,
  });
  const [year, setYear] = useState(now.getUTCFullYear());
  const [selected, setSelected] = useState<number | null>(null);

  const stats = useQuery({ queryKey: ['stats', year], queryFn: ({ signal }) => fetchStats(year, signal), placeholderData: keepPreviousData });
  const markers = useQuery({
    queryKey: ['markers', filter],
    queryFn: ({ signal }) => fetchMarkers(filter, signal),
    placeholderData: keepPreviousData,
    staleTime: filter.kind === '24h' ? 60_000 : undefined,
  });

  const changeFilter = useCallback((f: Filter) => {
    setFilter(f);
    setSelected(null);
  }, []);
  const changeYear = useCallback(
    (y: number) => {
      setYear(y);
      changeFilter({ kind: 'period', year: y });
    },
    [changeFilter],
  );

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Monitor de quedas de aeronaves</h1>
        <p>Aeronaves tripuladas, com base em órgãos oficiais de investigação e agências de notícias. Horários em UTC.</p>
      </header>

      <main className="map-area" aria-busy={markers.isFetching}>
        <div className="map-caption">
          <strong>{describe(filter)}</strong>
          <span>{markers.data ? `${markers.data.total} no mapa` : 'carregando…'}</span>
        </div>
        <Suspense fallback={<div className="map-placeholder">Carregando mapa…</div>}>
          <CrashMap markers={markers.data?.markers ?? []} selected={selected} onSelect={setSelected} />
        </Suspense>
        {markers.isError && <div className="error">Não foi possível carregar os acidentes.</div>}
      </main>

      <aside className="sidebar">
        <Counters stats={stats.data} filter={filter} year={year} onFilter={changeFilter} onYear={changeYear} now={now} />
        {selected !== null && <AccidentPanel id={selected} onClose={() => setSelected(null)} />}
      </aside>
    </div>
  );
}
