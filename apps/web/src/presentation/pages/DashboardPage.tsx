import { lazy, Suspense, useMemo } from 'react';
import { useCollectionStatus } from '../../application/queries/useCollectionStatus';
import { useAccident } from '../../application/queries/useAccident';
import { useMarkers } from '../../application/queries/useMarkers';
import { useStats } from '../../application/queries/useStats';
import { useDashboardState } from '../../application/useDashboardState';
import { siteLinks } from '../../config/siteLinks';
import { useI18n } from '../../i18n/I18nContext';
import { MapCaption } from '../components/molecules/MapCaption';
import { AccidentPanel } from '../components/organisms/AccidentPanel';
import { AppHeader } from '../components/organisms/AppHeader';
import { ProjectSidebar } from '../components/organisms/ProjectSidebar';
import { CountersPanel } from '../components/organisms/CountersPanel';
import { DashboardTemplate } from '../components/templates/DashboardTemplate';
import { Alert, AlertDescription } from '../components/ui/alert';

// Leaflet is only downloaded when the map mounts (separate chunk).
const CrashMap = lazy(() => import('../components/organisms/CrashMap'));

/** The site's only page: wires state and queries to the visual components. */
export function DashboardPage() {
  const { t, describeFilter } = useI18n();
  const { now, filter, year, selectedId, changeFilter, changeYear, selectAccident, clearSelection } = useDashboardState();
  const stats = useStats(year);
  const markers = useMarkers(filter);
  const accident = useAccident(selectedId);
  const status = useCollectionStatus();
  const reportTarget = useMemo(
    () => (selectedId === null ? null : { id: selectedId, location: accident.data?.location ?? null }),
    [selectedId, accident.data?.location],
  );

  return (
    <DashboardTemplate
      header={<AppHeader />}
      nav={<ProjectSidebar links={siteLinks} status={status.data} reportTarget={reportTarget} />}
      mapBusy={markers.isFetching}
      map={
        <>
          <MapCaption title={describeFilter(filter)} detail={markers.data ? t.onMap(markers.data.total) : t.loading} />
          <Suspense fallback={<div className="grid size-full place-items-center text-muted-foreground">{t.loadingMap}</div>}>
            <CrashMap markers={markers.data?.markers ?? []} selected={selectedId} onSelect={selectAccident} />
          </Suspense>
          {markers.isError && (
            <Alert variant="destructive" className="absolute bottom-4 left-1/2 z-[500] w-auto -translate-x-1/2 shadow-sm">
              <AlertDescription>{t.loadError}</AlertDescription>
            </Alert>
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
