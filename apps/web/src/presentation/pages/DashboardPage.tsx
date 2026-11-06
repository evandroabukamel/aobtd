import { lazy, Suspense } from 'react';
import { useAccident } from '../../application/queries/useAccident';
import { useMarkers } from '../../application/queries/useMarkers';
import { useStats } from '../../application/queries/useStats';
import { useDashboardState } from '../../application/useDashboardState';
import { StatusMessage } from '../components/atoms/StatusMessage';
import { MapCaption } from '../components/molecules/MapCaption';
import { AccidentPanel } from '../components/organisms/AccidentPanel';
import { AppHeader } from '../components/organisms/AppHeader';
import { CountersPanel } from '../components/organisms/CountersPanel';
import { DashboardTemplate } from '../components/templates/DashboardTemplate';
import { describeFilter } from '../shared/format';

// Leaflet só é baixado quando o mapa é montado (chunk separado).
const CrashMap = lazy(() => import('../components/organisms/CrashMap'));

/** Única página do site: liga o estado e as consultas aos componentes visuais. */
export function DashboardPage() {
  const { now, filter, year, selectedId, changeFilter, changeYear, selectAccident, clearSelection } = useDashboardState();
  const stats = useStats(year);
  const markers = useMarkers(filter);
  const accident = useAccident(selectedId);

  return (
    <DashboardTemplate
      header={<AppHeader />}
      mapBusy={markers.isFetching}
      map={
        <>
          <MapCaption
            title={describeFilter(filter)}
            detail={markers.data ? `${markers.data.total} no mapa` : 'carregando…'}
          />
          <Suspense fallback={<div className="map-placeholder">Carregando mapa…</div>}>
            <CrashMap markers={markers.data?.markers ?? []} selected={selectedId} onSelect={selectAccident} />
          </Suspense>
          {markers.isError && (
            <StatusMessage tone="error" as="div">
              Não foi possível carregar os acidentes.
            </StatusMessage>
          )}
        </>
      }
      sidebar={
        <>
          <CountersPanel stats={stats.data} filter={filter} year={year} now={now} onFilter={changeFilter} onYear={changeYear} />
          {selectedId !== null && (
            <AccidentPanel
              accident={accident.data}
              isLoading={accident.isLoading}
              isError={accident.isError}
              onClose={clearSelection}
            />
          )}
        </>
      }
    />
  );
}
